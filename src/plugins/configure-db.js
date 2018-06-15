'use strict'

const fp = require('fastify-plugin')

function decorateFastifyInstance (fastify, opts, next) {
  const { config, log } = fastify

  if (config.dbType === 'mongo') {
    fastify.register(require('fastify-mongodb'),
      {
        url: `mongodb://${config.mongoHost}:${config.mongoPort}/acmeair`
      }
    )
    log.info('fastify-mongo registered')
  } else {
    log.warn('db unsupported?')
  }

  next()
}

module.exports = fp(decorateFastifyInstance, {
  name: 'acmeair-configure-db'
})
