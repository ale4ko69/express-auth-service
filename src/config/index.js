"use strict"

const rootPath = process.cwd()
const configDir = `${rootPath}/config`
const {FORMAT_DATE = 'YYYY-MM-DD'} = process.env
const {baseUrl, backendHost, backendPort} = require('./http')
const DB_CONFIG = require('./database')
const settings = require('./setting.json')
console.log(rootPath);

module.exports = {
  baseUrl: baseUrl,
  backendHost: backendHost,
  backendPort: backendPort,
  rootPath: rootPath,
  configDir: configDir,
  formatDate: FORMAT_DATE,
  // config database
  mongodb: DB_CONFIG,
  ...settings
}
