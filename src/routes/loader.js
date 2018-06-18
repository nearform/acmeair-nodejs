'use strict'

const fp = require('fastify-plugin')
const DataLoader = require('../loader')

function addRouteToFastifyInstance (fastify, opts, next) {
  const { config } = fastify
  const {dbType} = config
  const dbClient = fastify[dbType]

  fastify.route({
    method: 'POST',
    url: `${config.apiRoot}/load`,
    handler: async (request, reply) => {
      const { body, log } = request // eslint-disable-line
      const numberToLoad = (request.body && request.body.numCustomers)
        ? request.body.numCustomers : (config.loader && config.loader.maxCustomers)
          ? config.loader.maxCustomers : 10000

      const result = await DataLoader.load({dbType, dbClient, log, config: config.loader}, numberToLoad)

      return result
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-loader'
})
