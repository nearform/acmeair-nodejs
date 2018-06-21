'use strict'

const fp = require('fastify-plugin')
const Book = require('../service/book')

function addRouteToFastifyInstance (fastify, opts, next) {
  const {config} = fastify
  const {dbType} = config
  const dbClient = fastify[dbType]

  fastify.route({
    method: 'POST',
    url: `${config.apiRoot}/book/flight`,
    handler: async (request, reply) => {
      const { body, log } = request
      const results = await Book.flight({dbType, dbClient, log}, body)

      return results
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-book'
})
