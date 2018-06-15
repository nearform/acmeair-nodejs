'use strict'

const fp = require('fastify-plugin')

const { contextRoot } = require('../../settings.json')
const { createSession, deleteSession } = require('../service/auth')

function addRouteToFastifyInstance (fastify, opts, next) {
  const { config, log } = fastify
  const dbClient = (fastify.mongo) ? fastify.mongo : {}

  fastify.route({
    method: 'POST',
    url: `${ contextRoot }/login`,
    handler: async (request, reply) => {
      const {body} = request
      const result = await createSession({dbClient}, body)

      return result
    }
  })

  fastify.route({
    method: 'POST',
    url: `${ contextRoot }/logout`,
    handler: async (request, reply) => {
      const {body} = request
      const result = await deleteSession({dbClient}, body)

      return result
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-auth'
})
