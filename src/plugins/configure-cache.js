'use strict'

const fp = require('fastify-plugin')
const lru = require('lru')
const cache = lru({max: 10, maxAge: 5000})

function decorateFastifyInstance (fastify, opts, next) {
  const { config, log } = fastify

  if (config.useCache === true) {
    log.info('using cache')
    fastify.register(require('fastify-caching'), {cache})
  }

  next()
}

module.exports = fp(decorateFastifyInstance, {
  name: 'acmeair-configure-cache'
})
