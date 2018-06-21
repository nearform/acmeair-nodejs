'use strict'

const fp = require('fastify-plugin')

const Config = require('../service/config')

function addRouteToFastifyInstance (fastify, opts, next) {
  const { config, log } = fastify
  const {dbType} = config
  const dbClient = fastify[dbType]

  fastify.route({
    method: 'GET',
    url: `${config.apiRoot}/config/count/:collectionName`,
    handler: async (request, reply) => {
      const {params} = request
      const result = await Config.collectionCount({dbType, dbClient, log}, {collectionName: params.collectionName, query: {}})

      log.info(`${params.collectionName} has ${result.data} records`)

      return result
    }
  })

  fastify.route({
    method: 'GET',
    url: `${config.apiRoot}/config/runtime`,
    handler: async (request, reply) => {
      const result = []
      const versions = process.versions

      for (let key in versions) {
        result.push({name: key, description: versions[key]})
      }

      return result
    }
  })

  fastify.route({
    method: 'GET',
    url: `${config.apiRoot}/config/dataServices`,
    handler: async (request, reply) => {
      return [
        {'name': 'cassandra', 'description': 'Apache Cassandra NoSQL DB'},
        {'name': 'cloudant', 'description': 'IBM Distributed DBaaS'},
        {'name': 'mongo', 'description': 'MongoDB NoSQL DB'}
      ]
    }
  })

  fastify.route({
    method: 'GET',
    url: `${config.apiRoot}/config/activeDataService`,
    handler: async (request, reply) => {
      return config.dbType
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-config'
})
