'use strict';
/**
 * @description Schema of User model.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSchema = require('./BaseSchema');
const {roles} = require('../../config');
const Utils = require('../../utils');
const mTAG = 'User'
const projection = {delete: 0, __v: 0, hash: 0, salt: 0};

const FIELDS = {
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    default: roles.maker,
    index: true
  },
  address: {
    type: String,
    required: false,
    index: true
  },
  phone: {
    type: String,
    index: true
  },
  company: {
    type: Schema.ObjectId,
    index: true
  },
  customer: {
    type: Schema.ObjectId,
    index: true
  },
  hash: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
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

const allowField = ['_id', 'email', 'name', 'role', 'phone', 'company', 'customer', 'insert', 'update'];
const methods = {
  getFields: function (fields = allowField) {
    return Utils.fillOptionalFields(this, {}, fields);
  }
};

const arrayJoin = [];

let tableSchema = BaseSchema(FIELDS, projection, methods, arrayJoin);

module.exports = mongoose.model(mTAG, tableSchema);
