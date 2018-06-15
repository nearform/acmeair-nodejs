'use strict'

const fp = require('fastify-plugin')
const Flights = require('../service/flights')

function addRouteToFastifyInstance (fastify, opts, next) {
  const { config, log, service } = fastify
  const dbClient = (fastify.mongo) ? fastify.mongo : {}

  fastify.route({
    method: 'POST',
    url: `${ config.apiRoot }/flights`,
    handler: async (request, reply) => {
      const { body, log } = request
      const results = await Flights.show({dbClient, log}, body)

      return results
    }
  })

  fastify.route({
    method: 'POST',
    url: `${ config.apiRoot }/flights/returning-from`,
    handler: async (request, reply) => {
      const { body, log } = request
      const results = await Flights.findBySegmentId({dbClient, log}, body)

      return results
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-flights'
})
