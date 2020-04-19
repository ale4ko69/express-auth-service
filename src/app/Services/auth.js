'use strict'

const BaseService = require('./GRPC');
const to = require('await-to-js').default;
const AuthUtil = require('../../utils/auth');
const HttpUtil = require('../../utils/http');
const Utils = require('../../utils');
const Model = require('../Models/User');
const ModelToken = require('../Models/Token');
const {roles} = require('../../config');

class AuthService extends BaseService {
  constructor() {
    super(AuthService)
    this.model = Model;
    this.mToken = ModelToken;
  }

  async lists(call, callback) {
    return super.lists(call, callback)
  }

  async fetch(call, callback) {
    return super.fetch(call, callback);
  }

  async login(cb, options) {
    const requireParams = ['username', 'password'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let {username, password, scope} = options;
    let value;
    if (["root", "root@gmail.com"].indexOf(username) > -1) {
      value = username
    } else {
      value = `${scope}.${username}`
    }
    let result;
    let [err, user] = await to(this.model.getOne({username: value}, true, {}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Found_Errors.user', err.message);
      return this.response(cb, result)
    }
    if (!user || user.delete) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Not_Exists.user', username);
      return this.response(cb, result)
    }
    if (!AuthUtil.validPassword(user, password)) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Errors.Incorrect_Password');
      return this.response(cb, result)
    }
    let token = AuthUtil.generateJwt(user);
    [err, result] = await to(this.mToken.insertOne({user: user._id, token: token}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.login', err.message)
    } else {
      ['__v', 'hash', 'salt', 'scope', 'update', 'insert'].forEach(field => delete user[field]);
      result = {data: {token, user}}
    }
    return this.response(cb, result)
  }

  async register(cb, options) {
    const requireParams = ['email', 'name', 'password'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let {email, name, password, scope} = options;
    let result;
    if (["root", "root@gmail.com"].indexOf(email) > -1) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Unique.user.email', email)
      return this.response(cb, result)
    }
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
    let obj = {email, name, username, scope, role: roles.guest, salt, hash};
    [err, user] = await to(this.model.insertOne(obj));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.register', err.message);
      return this.response(cb, result)
    }
    user = user.getFields();
    user = Utils.cloneObject(user);
    let token = AuthUtil.generateJwt(user);
    [err, result] = await to(this.mToken.insertOne({user: user._id, token: token}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.login', err.message)
    } else {
      result = {data: {token, user}}
    }
    return this.response(cb, result)
  }

  async changePassword(cb, options) {
    const requireParams = ['userId', 'old_password', 'new_password'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let {userId, old_password, new_password} = options
    if (Utils.compareString(old_password, new_password)) {
      return this.response(cb, HttpUtil.createErrorInvalidInput('Errors.New_Old_Pw_Must_Different'))
    }
    let result;
    let [err, user] = await to(this.model.getOne({_id: userId}, false, {}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Found_Errors.user', err.message);
      return this.response(cb, result)
    }
    if (!user || user.delete) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Not_Exists.user', userId);
      return this.response(cb, result)
    }
    if (!AuthUtil.validPassword(user, old_password)) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Errors.Old_Pw_Not_Match');
      return this.response(cb, result)
    }
    let objUpdate = AuthUtil.setPassword(new_password);
    [err, result] = await to(Promise.all([
      this.model.updateOne(user._id, objUpdate),
      this.mToken.deleteByCondition({user: user._id})
    ]));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.Change_Password', err.message)
    } else {
      result = {message: Utils.localizedText('Success.Change_Password')}
    }
    return this.response(cb, result)
  }

  async resetPassword(cb, options) {
    const requireParams = ['userId', 'new_password'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let result;
    let {userId, new_password, type = null} = options;
    let condition = {_id: userId};
    if (type) condition[type] = userId;
    let [err, user] = await to(this.model.getOne(condition, false, {}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Found_Errors.user', err.message);
      return this.response(cb, result)
    }
    if (!user || user.delete) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Not_Exists.user', userId);
      return this.response(cb, result)
    }
    let objUpdate = AuthUtil.setPassword(new_password);
    [err, result] = await to(Promise.all([
      this.model.updateOne(user._id, objUpdate),
      this.mToken.deleteByCondition({user: user._id})
    ]));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.Reset_Password', err.message)
    } else {
      result = {message: Utils.localizedText('Success.Reset_Password')}
    }
    return this.response(cb, result)
  }

  async checkTokens(cb, options) {
    const requireParams = ['token'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let [err, result] = await to(this.mToken.getOne({token: options.token}, true));
    if (err) {
      result = HttpUtil.createError(HttpUtil.UNPROCESSABLE_ENTITY, 'Found_Errors.general', err.message)
    } else {
      if (!result || Utils.isString(result.user) || result.expiredAt <= Date.now()) {
        result = HttpUtil.createError(HttpUtil.UNAUTHORIZED, 'unauthorized')
      } else {
        result = {data: {token: result.token, authUser: result.user}}
      }
    }
    return this.response(cb, result)
  }

  async logout(cb, options) {
    const requireParams = ['token'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) {
      return this.response(cb, HttpUtil.createErrorInvalidInput(options.error));
    }
    let [err, result] = await to(this.mToken.deleteByCondition({token: options.token}));
    if (err) {
      result = HttpUtil.createError(HttpUtil.INTERNAL_SERVER_ERROR, 'Errors.logout', err.message)
    } else {
      result = {message: Utils.localizedText('Success.general')}
    }
    return this.response(cb, result)
  }
}

module.exports = new AuthService()
