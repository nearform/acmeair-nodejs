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
  const dbClient = (fastify.mongo) ? fastify.mongo : {}

  fastify.route({
    method: 'GET',
    url: `${contextRoot}/customer/:sessionId`,
    handler: async (request, reply) => {
      const {params} = request
      const result = await findCustomerBySessionId({dbClient}, params)

      return result
    }
  })

  fastify.route({
    method: 'POST',
    url: `${contextRoot}/customer/:customerId`,
    handler: async (request, reply) => {
      const {params, body} = request
      const result = await updateProfile({dbClient}, {_id: params.customerId, data: body})

      return result
    }
  })

  fastify.route({
    method: 'GET',
    url: `${contextRoot}/customer/:customerId/bookings`,
    handler: async (request, reply) => {
      const {params} = request
      const result = await getBookings({dbClient}, {customerId: params.customerId})

      return result
    }
  })

  fastify.route({
    method: 'POST',
    url: `${contextRoot}/customer/:customerId/bookings/:bookingId`,
    handler: async (request, reply) => {
      const {params} = request

      await cancelBooking({dbClient}, {customerId: params.customerId, _id: params.bookingId})
      const result = await getBookings({dbClient}, {customerId: params.customerId})

      return result
    }
  })

  next()
}

module.exports = fp(addRouteToFastifyInstance, {
  name: 'acmeair-customer'
})
