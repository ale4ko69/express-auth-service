'use strict'

const BaseService = require('./GRPC');
const to = require('await-to-js').default;
const AuthUtil = require('../../utils/auth');
const HttpUtil = require('../../utils/http');
const Utils = require('../../utils');
const Model = require('../Models/User');
const ModelToken = require('../Models/Token');
const {APP_KEY} = require('../../config/env/auth');
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

  async detail(call, callback) {
    return super.detail(call, callback)
  }

  async filters(call, callback) {
    return super.filters(call, callback)
  }

  async update(call, callback) {
    return super.update(call, callback)
  }

  async fetch(call, callback) {
    return super.fetch(call, callback);
  }

  async login(options) {
    options = HttpUtil.checkRequiredParams2(options, ['username', 'password', 'secret']);
    if (options.error) throw Error(options.error);

    let {username, password, secret} = options;
    if (!APP_KEY[secret]) throw Error(`System is not supported`);

    let value;
    if (["root", "root@gmail.com"].indexOf(username) > -1) {
      value = username
    } else {
      value = `${APP_KEY[secret]}${username}`
    }
    let condition = {$or: [{email: value}, {username: value}]};
    let [err, user] = await to(this.model.getOne(condition, true, {}));
    if (err) throw Error(Utils.localizedText('Found_Errors.user', err.message));
    if (!user || user.delete) throw Error(Utils.localizedText('Not_Exists.user', username));

    if (!AuthUtil.validPassword(user, password)) {
      throw new Error(Utils.localizedText('Errors.Incorrect_Password'))
    }

    let token = AuthUtil.generateJwt(user);
    ['__v', 'hash', 'salt', 'secretKey', 'update', 'insert'].forEach(field => delete user[field]);

    let result;
    [err, result] = await to(this.mToken.insertOne({user: user._id, token: token}));
    if (err) throw Error(Utils.localizedText('Errors.login', err.message));

    return {token, authUser: user}
  }

  async register(options) {
    const requireParams = ['email', 'name', 'password', 'secret'];
    options = HttpUtil.getRequiredParamsFromJson2(options, requireParams);
    if (options.error) throw Error(options.error);

    let {email, name, password, secret} = options;
    if (!APP_KEY[secret]) throw Error(`System is not supported`);
    let secretKey = APP_KEY[secret];
    let username = `${secretKey}${email}`;
    let [err, user] = await to(this.model.getOne({username: username}));
    if (err) throw Error(Utils.localizedText('Found_Errors.user', err.message));
    if (user) throw Error(Utils.localizedText('Unique.user.email', email));

    let {salt, hash} = AuthUtil.setPassword(password);
    let obj = {email, name, username, secretKey, role: roles.guest, salt, hash};

    [err, user] = await to(this.model.insertOne(obj));
    if (err) throw Error(Utils.localizedText('Errors.register', err.message));

    user = user.getFields();
    user = Utils.cloneObject(user);
    let token = AuthUtil.generateJwt(user);
    let result;
    [err, result] = await to(this.mToken.insertOne({user: user._id, token: token}));
    if (err) throw Error(Utils.localizedText('Errors.login', err.message));

    return {token, authUser: user}
  }

  async changePassword(options) {
    const requireParams = ['userId', 'old_password', 'new_password'];
    options = HttpUtil.getRequiredParamsFromJson2(options, requireParams);
    if (options.error) throw Error(options.error);

    let {userId, old_password, new_password} = options
    if (Utils.compareString(old_password, new_password)) {
      throw Error(Utils.localizedText('Errors.New_Old_Pw_Must_Different'))
    }

    let [err, user] = await to(this.model.getOne({_id: userId}, false, {}));
    if (err) throw Error(Utils.localizedText('Found_Errors.user', err.message));
    if (!user || user.delete) throw Error(Utils.localizedText('Not_Exists.user', userId));

    if (!AuthUtil.validPassword(user, old_password)) {
      throw Error(Utils.localizedText('Errors.Old_Pw_Not_Match'))
    }

    let objUpdate = AuthUtil.setPassword(new_password);
    let result;
    [err, result] = await to(Promise.all([
      this.model.updateOne(user._id, objUpdate),
      this.mToken.deleteByCondition({user: user._id})
    ]));
    if (err) throw Error(Utils.localizedText('Errors.Change_Password', err.message));

    return Utils.localizedText('Success.Change_Password')
  }

  async resetPassword(options) {
    const requireParams = ['userId', 'new_password'];
    options = HttpUtil.getRequiredParamsFromJson2(options, requireParams);
    if (options.error) throw Error(options.error);

    let {userId, new_password} = options;
    let [err, user] = await to(this.model.getOne({_id: userId}, false, {}));
    if (err) throw Error(Utils.localizedText('Found_Errors.user', err.message));
    if (!user || user.delete) throw Error(Utils.localizedText('Not_Exists.user', userId));

    let objUpdate = AuthUtil.setPassword(new_password);
    let result;
    [err, result] = await to(Promise.all([
      this.model.updateOne(user._id, objUpdate),
      this.mToken.deleteByCondition({user: user._id})
    ]));
    if (err) throw Error(Utils.localizedText('Errors.Reset_Password', err.message));

    return Utils.localizedText('Success.Reset_Password')
  }

  async checkTokens(options) {
    const requireParams = ['token'];
    options = HttpUtil.getRequiredParamsFromJson2(options, requireParams);
    if (options.error) throw Error(options.error);

    let [err, result] = await to(this.mToken.getOne({token: options.token}, true));
    if (err) throw Error(Utils.localizedText('Found_Errors.general', err.message));
    if (!result || Utils.isString(result.user)) throw Error(Utils.localizedText('unauthorized'));

    return {token: result.token, authUser: result.user}
  }

  async logout(options) {
    const requireParams = ['token'];
    options = HttpUtil.getRequiredParamsFromJson2(options, requireParams);
    if (options.error) throw Error(options.error);

    let [err, result] = await to(this.mToken.deleteByCondition({token: options.token}));
    if (err) throw Error(Utils.localizedText('Errors.logout', err.message));

    return Utils.localizedText('Success.general')
  }
}

module.exports = new AuthService()
