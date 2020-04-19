'use strict'

const to = require('await-to-js').default;
const DBUtil = require('../../../utils/Database');
const HttpUtil = require('../../../utils/http');
const Utils = require('../../../utils');
const {APP_KEY} = require('../../../config/env/auth');
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
    let params = HttpUtil.checkRequiredParams2(call.request, ["options", "methodName"]);
    if (params.error) return this.response(callback, HttpUtil.createErrorInvalidInput(params.error));
    let {options, methodName} = params;
    options = options ? JSON.parse(options) : {};
    let msg;
    if (Utils.isObjectEmpty(options)) {
      msg = HttpUtil.createErrorInvalidInput('Params options must be a non-blank object');
      return this.response(callback, msg)
    }
    if (!this._methods.includes(methodName)) {
      msg = `Service '${methodName}' is not defined`;
      return this.error(callback, msg, statusCode.UNIMPLEMENTED)
    }
    let {secret} = options;
    if (!secret || !APP_KEY[secret]) {
      msg = HttpUtil.createError(HttpUtil.METHOD_NOT_ALLOWED, `System is not supported`);
      return this.response(callback, msg)
    }
    options.scope = APP_KEY[secret];
    delete options.secret;
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
