'use strict'

const BaseService = require('./base')
const Model = require('../../../Models/User')

class Service extends BaseService {
  constructor () {
    super(Service)
    this.model = Model
  }

  async lists (call, callback) {
    return super.lists(call, callback)
  }

  async detail (call, callback) {
    return super.detail(call, callback)
  }

  async filters (call, callback) {
    return super.filters(call, callback)
  }

  async update (call, callback) {
    return super.update(call, callback)
  }

  async changePassword (options) {

  }
}

module.exports = new Service()
