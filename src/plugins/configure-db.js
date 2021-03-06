'use strict'

const fp = require('fastify-plugin')

function decorateFastifyInstance (fastify, opts, next) {
  const { config, log } = fastify

  if (config.dbType === 'mongo') {
    log.info(`attempting connection to mongo ${config.mongoHost}:${config.mongoPort}`)

    const poolSize = (config.mongoConnectionPoolSize) ? config.mongoConnectionPoolSize : 5

    fastify.register(require('fastify-mongodb'),
      {
        url: `mongodb://${config.mongoHost}:${config.mongoPort}/acmeair`,
        poolSize
      }
    )
    log.info('fastify-mongo registered')
  } else if (config.dbType === 'couch') {
    const url = `https://${config.cloudantUser}:${config.cloudantPassword}@${config.cloudantUrl}`

    fastify.register(require('fastify-couchdb'), {url})
    log.info('fastify-couchdb registered')
  } else {
    log.warn('db unsupported?')
  }

  next()
}

module.exports = fp(decorateFastifyInstance, {
  name: 'acmeair-configure-db'
})
