'use strict'

const BaseService = require('./GRPC');
const to = require('await-to-js').default;
const AuthUtil = require('../../utils/auth');
const Model = require('../Models/User');
const ModelToken = require('../Models/Token');

class AuthService extends BaseService {
  constructor () {
    super(AuthService)
    this.model = Model;
    this.mToken = ModelToken;
  }

  async lists (call, callback) {
    return super.lists(call, callback)
  }
  async fetch (call, callback) {
    return super.fetch(call, callback);
  }

  // async detail (call, callback) {
  //   return super.detail(call, callback)
  // }

  // async filters (call, callback) {
  //   return super.filters(call, callback)
  // }

  // async update (call, callback) {
  //   return super.update(call, callback)
  // }

  async login (options) {
    console.log('login');
    let {username, password} = options;
    let condition = {$or: [{email: username}, {username: username}]};

    let [err, user] = await to(this.model.getOne(condition, true, {}));
    if (err) {
      console.log('not found user');
      throw err;
    }

    if (!user || user.delete) return HttpUtil.unprocessable(res, Utils.localizedText('Not_Exists.user', username))
    if (!AuthUtil.validPassword(user, password)) {
      console.log('Incorrect_Password');
      throw new Error('Errors.Incorrect_Password')
    }

    let token = AuthUtil.generateJwt(user);
    ['hash', 'salt', '__v', 'update', 'insert'].forEach(field => delete user[field]);
    // await to(this.tokenModel.insertOne({
    //   user: user._id,
    //   token: token
    // }))
    console.log('token', token);
    return {
      token,
      authUser: user
    }

  }

  async logout (options) {

  }

  async check (options) {

  }
}

module.exports = new AuthService()
