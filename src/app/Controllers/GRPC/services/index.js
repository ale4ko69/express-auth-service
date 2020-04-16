'use strict'

const { rootPath } = require('../config')
const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
}

module.exports = function (grpc, protoLoader, gRpcServer, subject) {
  const path = `${rootPath}/src/app/Controllers/GRPC/proto/${subject}.proto`
  const subjectProto = protoLoader.loadSync(path, protoOptions)
  const descriptor = grpc.loadPackageDefinition(subjectProto)
  const serviceName = `${subject}Service`
  const Service = require(`./${subject.toLowerCase()}`)

  gRpcServer.addService(descriptor[serviceName].service, {
    list: Service.lists,
    detail: Service.detail,
    filter: Service.filters,
    update: Service.update,
    fetch: Service.fetch
  })
}
