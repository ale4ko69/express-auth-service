'use strict'

const gRpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const gRpcServer = new gRpc.Server()
require('./services')(gRpc, protoLoader, gRpcServer, 'User')
require('./services')(gRpc, protoLoader, gRpcServer, 'Auth')

const {gRpcServerUri} = require('./config')
gRpcServer.bind(gRpcServerUri, gRpc.ServerCredentials.createInsecure())
console.log(`gRPC server running in ${gRpcServerUri}`)

module.exports = gRpcServer
