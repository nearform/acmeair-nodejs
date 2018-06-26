'use strict'
require('dotenv').config()

const path = require('path')
const fastify = require('fastify')({ logger: true })
const _port = (process.env.PORT) ? process.env.PORT : 9080
const _host = (process.env.HOST) ? process.env.HOST : 'localhost'

fastify
  .register(require('under-pressure'), {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000
  })
  .register(require('fastify-cookie'))
  .register(require('fastify-formbody'))
  .register(require('./src/plugins/determine-env'))
  .register(require('./src/plugins/configure-db'))
  .register(require('./src/routes/loader'))
  .register(require('./src/routes/config'))
  .register(require('./src/routes/auth'))
  .register(require('./src/routes/customer'))
  .register(require('./src/routes/flights'))
  .register(require('./src/routes/book'))

  .register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/'
  })

  .listen(_port, _host,  (err, address) => {
    if (err) {
      console.log(err)
      process.exit(1)
    }
  })