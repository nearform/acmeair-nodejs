'use strict'

const fp = require('fastify-plugin')
const Flights = require('../service/flights')

function addRouteToFastifyInstance (fastify, opts, next) {
  const {config} = fastify
  const {dbType} = config
  const dbClient = fastify[dbType]

  fastify.route({
    method: 'POST',
    url: `${config.apiRoot}/flights`,
    handler: async (request, reply) => {
      const { body, log } = request
      const results = await Flights.show({dbType, dbClient, log}, body)

      return results
    }
  })

  fastify.route({
    method: 'POST',
    url: `${config.apiRoot}/flights/returning-from`,
    handler: async (request, reply) => {
      const { body, log } = request
      const results = await Flights.findBySegmentId({dbType, dbClient, log}, body)

      return results
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-flights'
})
