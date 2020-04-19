'use strict'

const to = require('await-to-js').default;
const AuthUtil = require('../../utils/auth');
const HttpUtil = require('../../utils/http');
const Utils = require('../../utils');
const BaseService = require('./GRPC');
const Model = require('../Models/User');
const ModelToken = require('../Models/Token');

class Service extends BaseService {
  constructor() {
    super(Service)
    this.model = Model;
    this.mToken = ModelToken;
  }

  async lists(call, callback) {
    return super.lists(call, callback)
  }

  async fetch(call, callback) {
    return super.fetch(call, callback);
  }

  async store(cb, options) {
    const requireParams = ['email', 'name', 'role', 'password', 'scope'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    const acceptFields = [...requireParams, 'address', 'phone', 'company', 'agency', 'customer'];
    options = Utils.getAcceptableFields(options, acceptFields);
    let {email, password, scope} = options;
    let result;
    let username = `${scope}.${email}`;
    let [err, user] = await to(this.model.getOne({username: username}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Found_Errors.user', err.message);
      return this.response(cb, result)
    }
    if (user) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Unique.user.email', email)
      return this.response(cb, result)
    }
    let {salt, hash} = AuthUtil.setPassword(password);
    delete options.password;

    let obj = {...options, username, scope, salt, hash};
    [err, user] = await to(this.model.insertItem(obj));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.create', err.message)
    } else {
      user = user.getFields();
      user = Utils.cloneObject(user);
      result = {data: user}
    }
    return this.response(cb, result)
  }

  async destroy(cb, options) {
    const requireParams = ['userId', 'softDelete'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let result;
    let {userId, softDelete} = options;
    let [err, user] = await to(this.model.getOne({_id: userId}, false, {}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Found_Errors.user', err.message);
      return this.response(cb, result)
    }
    if (!user || user.delete) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Not_Exists.user', userId);
      return this.response(cb, result)
    }
    let actions = [
      this.mToken.deleteByCondition({user: user._id})
    ];
    if (softDelete && softDelete === "true") {
      actions.push(this.model.deleteByCondition({_id: user._id}))
    } else {
      actions.push(this.model.softDeletes({_id: user._id}))
    }
    [err, result] = await to(Promise.all(actions));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.delete', err.message)
    } else {
      result = {message: Utils.localizedText('Success.delete')}
    }
    return this.response(cb, result)
  }
}

module.exports = new Service()
