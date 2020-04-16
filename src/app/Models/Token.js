'use strict';
/**
 * @description Schema of Token model.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSchema = require('./BaseSchema');
const mTAG = 'Token'
const projection = {__v: 0};

const FIELDS = {
  token: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    default: 'Bearer'
  },
  expiredAt: {
    type: String,
    default: Date.now() + 7 * 24 * 60 * 60
  },
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
  }
}

const arrayJoin = [
  {path: 'user', select: 'email name role address phone company customer'},
];

let tableSchema = BaseSchema(FIELDS, projection, null, arrayJoin);

module.exports = mongoose.model(mTAG, tableSchema);
