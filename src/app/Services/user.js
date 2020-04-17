'use strict'

const to = require('await-to-js').default;
const AuthUtil = require('../../utils/auth');
const HttpUtil = require('../../utils/http');
const Utils = require('../../utils');
const BaseService = require('./GRPC');
const Model = require('../Models/User');
const {APP_KEY} = require('../../config/env/auth');

class Service extends BaseService {
  constructor() {
    super(Service)
    this.model = Model
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

  async store(options) {
    const requireParams = ['email', 'name', 'role', 'password', 'secret'];
    options = HttpUtil.checkRequiredParams2(options, requireParams);
    if (options.error) throw Error(options.error);

    const acceptFields = [...requireParams, 'address', 'phone', 'company', 'customer'];
    options = Utils.getAcceptableFields(options, acceptFields);
    let {email, password, secret} = options;
    if (!APP_KEY[secret]) throw Error(`System is not supported`);

    let secretKey = APP_KEY[secret];
    let username = `${secretKey}${email}`;
    let [err, user] = await to(this.model.getOne({username: username}));
    if (err) throw Error(Utils.localizedText('Found_Errors.user', err.message));
    if (user) throw Error(Utils.localizedText('Unique.user.email', email));

    let {salt, hash} = AuthUtil.setPassword(password);
    delete options.password;
    delete options.secret;

    let obj = {...options, username, secretKey, salt, hash};
    [err, user] = await to(this.model.insertOne(obj));
    if (err) throw Error(Utils.localizedText('Errors.create', err.message));

    user = user.getFields();
    user = Utils.cloneObject(user);
    return {user}
  }
}

module.exports = new Service()
