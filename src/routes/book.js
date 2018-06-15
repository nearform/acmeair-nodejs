'use strict'

const fp = require('fastify-plugin')
const Book = require('../service/book')

function addRouteToFastifyInstance (fastify, opts, next) {
  const { config, log, service } = fastify
  const dbClient = (fastify.mongo) ? fastify.mongo : {}

  fastify.route({
    method: 'POST',
    url: `${ config.apiRoot }/book/flight`,
    handler: async (request, reply) => {
      const { body, log } = request
      const results = await Book.flight({dbClient, log}, body)

      return results
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-book'
})
