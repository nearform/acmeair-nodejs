'use strict'

const fp = require('fastify-plugin')
const settings = require('../../settings.json')

// TODO: determine if this VCAP stuff is necessary
function setFastifyConfig (fastify, options, next) {
  const {
    DBTYPE,
    CLOUDANT_USERNAME,
    CLOUDANT_PASSWORD,
    CLOUDANT_URL,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_POOLSIZE
  } = process.env


  fastify.register(require('fastify-env'), {
    schema: {
      type: 'object',
      required: [ 'dbType' ],
      dotenv: true,
      properties: {
        dbType: { type: 'string', default: DBTYPE },
        mongoHost: {
          type: 'string',
          default: MONGO_HOST
        },
        mongoPort: {
          type: 'number',
          default: MONGO_PORT
        },
        mongoConnectionPoolSize: {
          type: 'number',
          default: MONGO_POOLSIZE
        },
        cloudantUrl: {
          type: 'string',
          default: CLOUDANT_URL
        },
        cloudantUser: {
          type: 'string',
          default: CLOUDANT_USERNAME
        },
        cloudantPassword: {
          type: 'string',
          default: CLOUDANT_PASSWORD
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
