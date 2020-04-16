'use strict';
/**
 * @description Schema of User model.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSchema = require('./BaseSchema');
const {roles} = require('../../config');
const Utils = require('../../utils');
const mTAG = 'Token'
const projection = {delete: 0, __v: 0, hash: 0, salt: 0};

const FIELDS = {
  token: {
    type: String,
    required: true,
    index: true
  },
  type: { type: String, default: 'Bearer'},
  expiredAt: { type: String, default: null },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    index: true
  },
  insert: {
    when: {type: Date, default: Date.now}
  },
  update: {
    when: {type: Date}
  },
  delete: {
    when: {type: Date}
  }
}

const allowField = ['_id', 'token', 'user', 'type', 'expiredAt', 'insert', 'update'];
const methods = {
  getFields: function (fields = allowField) {
    return Utils.fillOptionalFields(this, {}, fields);
  }
};

const arrayJoin = [];

let tableSchema = BaseSchema(FIELDS, projection, methods, arrayJoin);

module.exports = mongoose.model(mTAG, tableSchema);
