'use strict'

const to = require('await-to-js').default;
const DBUtil = require('../../../utils/Database');
const HttpUtil = require('../../../utils/http');
const Utils = require('../../../utils');
const statusCode = {
  INVALID_ARGUMENT: 3,
  UNIMPLEMENTED: 12
};

class BaseService {
  constructor(child) {
    this._methods = [];
    this.bindingMethods = this.bindingMethods.bind(this);
    this.bindingMethods(child);
  }

  async lists(call, callback) {
    let {options} = call.request;
    options = options ? JSON.parse(options) : {};
    const {page, perPage, filters = {}} = options;
    let [err, rs] = await to(Promise.all([
      this.model.lists(options),
      this.model.getCount(filters)
    ]));
    if (err) {
      rs = {code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message}
    } else {
      rs = {data: DBUtil.paginationResult(page, perPage, rs[0], rs[1], filters), stringify: false}
    }
    return this.response(callback, rs);
  }

  /*
    *** handle request
   */
  async fetch(call, callback) {
    let {options, methodName} = call.request;
    if (!methodName || !options) {
      return this.error(callback, 'Service methodName is not provided');
    }
    options = options ? JSON.parse(options) : {};
    if (Utils.isObjectEmpty(options)) {
      return this.error(callback, 'Params options must be an empty object');
    }
    if (!this._methods.includes(methodName)) {
      return this.error(callback,
        `Service '${methodName}' is not defined`,
        statusCode.UNIMPLEMENTED
      );
    }
    return await this[methodName](callback, options)
  }

  async detail(cb, options) {
    let {params} = options;
    let [err, rs] = await to(this.model.getOne({_id: params}, true));
    if (err) {
      rs = {code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message}
    } else {
      rs = {data: rs}
    }
    return this.response(cb, rs)
  }

  async filters(cb, options) {
    let {conditions} = options;
    let [err, rs] = await to(this.model.findByCondition(conditions, true));
    if (err) {
      rs = {code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message}
    } else {
      rs = {data: rs}
    }
    return this.response(cb, rs)
  }

  async update(cb, options) {
    let {condition, data, multi = false} = options;
    let [err, rs] = await to(this.model.update(condition, data, multi));
    if (err) {
      rs = {code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message}
    } else {
      rs = {message: Utils.localizedText("Success.update"), data: rs}
    }
    return this.response(cb, rs)
  }

  error(cb, message, code = statusCode.INVALID_ARGUMENT) {
    cb({code, message}, null);
  }

  response(cb, {code = HttpUtil.OK, message = "Success", data = undefined, stringify = true}) {
    if (data && stringify) data = JSON.stringify(data);
    cb(null, {code, message, data})
  }

  bindingMethods(obj) {
    let methods = Object.getOwnPropertyNames(obj.prototype);
    methods = methods.filter(x => (x !== 'constructor' && x !== 'bindingMethods'));
    this._methods = methods;
    for (const method of methods) {
      this[method] = this[method].bind(this);
    }
  }
}

module.exports = BaseService
