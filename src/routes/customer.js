'use strict'

const fp = require('fastify-plugin')

const { contextRoot } = require('../../settings.json')
const {
  cancelBooking,
  findCustomerBySessionId,
  updateProfile,
  getBookings
} = require('../service/customer')

function addRouteToFastifyInstance (fastify, opts, next) {
  const {config} = fastify
  const {dbType} = config
  const dbClient = fastify[dbType]

  fastify.route({
    method: 'GET',
    url: `${contextRoot}/customer/:sessionId`,
    handler: async (request, reply) => {
      const {params} = request
      const result = await findCustomerBySessionId({dbType, dbClient}, params)

      return result
    }
  })

  fastify.route({
    method: 'POST',
    url: `${contextRoot}/customer/:customerId`,
    handler: async (request, reply) => {
      const {params, body} = request
      const result = await updateProfile({dbType, dbClient}, {_id: params.customerId, data: body})

      return result
    }
  })

  fastify.route({
    method: 'GET',
    url: `${contextRoot}/customer/:customerId/bookings`,
    handler: async (request, reply) => {
      const {params} = request
      const result = await getBookings({dbType, dbClient}, {customerId: params.customerId})

      return result
    }
  })

  fastify.route({
    method: 'POST',
    url: `${contextRoot}/customer/:customerId/bookings/:bookingId`,
    handler: async (request, reply) => {
      const {params} = request

      await cancelBooking({dbType, dbClient}, {customerId: params.customerId, _id: params.bookingId})
      const result = await getBookings({dbType, dbClient}, {customerId: params.customerId})

      return result
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-customer'
})
