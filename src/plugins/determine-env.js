'use strict'

const fp = require('fastify-plugin')
const pino = require('pino')()
const settings = require('../../settings.json')

let dbType = process.env.dbtype || 'mongo'
// TODO: is this JSON.parse necessary?
let currentEnv = (process.env.VCAP_SERVICES) ? JSON.parse(process.env.VCAP_SERVICES) : 'local'
let mongoHost, mongoPort, mongoConnectionPoolSize

// determine the backend datastore type if run inside BLuemix or cloud foundry
if (process.env.VCAP_SERVICES) {
  const env = JSON.parse(process.env.VCAP_SERVICES)
  currentEnv = env
  const serviceKey = Object.keys(env)[0]
  if (serviceKey && serviceKey.indexOf('cloudant') > -1) {
    dbType = 'cloudant'
  } else if (serviceKey && serviceKey.indexOf('redis') > -1) {
    dbType = 'redis'
  }
} else {
  mongoHost = (process.env.MONGO_HOST) ? process.env.MONGO_HOST : settings.mongoHost
  mongoPort = (process.env.MONGO_PORT) ? process.env.MONGO_PORT : settings.mongoPort
  mongoConnectionPoolSize = (process.env.MONGO_POOLSIZE) ? process.env.MONGO_POOLSIZE : settings.mongoConnectionPoolSize
}

function setFastifyConfig (fastify, options, next) {
  pino.info({env: currentEnv, dbType})

  fastify.register(require('fastify-env'), {
    schema: {
      type: 'object',
      required: [ 'dbType' ],
      properties: {
        dbType: { type: 'string', default: 'mongo' },
        mongoHost: {
          type: 'string',
          default: mongoHost
        },
        mongoPort: {
          type: 'number',
          default: mongoPort
        },
        mongoConnectionPoolSize: {
          type: 'number',
          default: mongoConnectionPoolSize
        },
        VMC_APP_PORT: {type: 'string'},
        VCAP_APP_PORT: {type: 'string'},
        VCAP_APP_HOST: {
          type: 'string',
          default: 'localhost'
        },
        AUTH_SERVICE: {type: 'string'},
        loader: {
          type: 'object',
          default: settings.loader
        },
        apiRoot: {
          type: 'string',
          default: settings.contextRoot
        }
      }
    },
    data: options
  })

  next()
}

module.exports = fp(setFastifyConfig, {
  name: 'acmeair-determine-env'
})
