'use strict'
var format = require('date-fns/format')
const uuidv4 = require('uuid/v4');
const addHours = require('date-fns/add_hours')

const {
  deleteOne,
  find,
  update
} = require('../db/mongo')

const getSession = async (options, context) => {
  const { dbClient } = options
  const query = {
    _id: (context.sessionId) ? context.sessionId : ''
  }
 
  const result = await find(dbClient, 'customerSession', query)

  return result
}

const getProfile = async (options, context) => {
  const { dbClient } = options
  const query = {
    _id: (context.customerId) ? context.customerId : ''
  }
  const result = await find(dbClient, 'customer', query)

  return result
}

const getProfileByEmail = async (options, context) => {
  const { dbClient } = options
  const query = {
    email: (context.email) ? context.email : ''
  }
  const results = await find(dbClient, 'customer', query)

  console.log(results)

  return {data: results.data}
}

const findCustomerBySessionId = async (options, context) => {
  const currentSession = await getSession(options, context)
  let _data = []

  if (currentSession.data && currentSession.data[0]) {
    const customerQuery = { customerId: currentSession.data[0].customerId }
    const results = await getProfile(options, customerQuery)

    _data = results.data
  }

  return {data: _data}
}

const updateProfile = async (options, context) => {
  const { dbClient } = options
  const doc = context.data

  const results = await update(dbClient, 'customer', {_id: context._id}, doc)

  return results
}

const getBookings = async (options, context) => {
  const { dbClient } = options
  const { customerId } = context

  const results = await find(dbClient, 'booking', {customerId})

  return results
}

const cancelBooking = async (options, context) => {
  const { dbClient } = options
  const results = await deleteOne(dbClient, 'booking', context)

  return results
}

module.exports = {
  cancelBooking,
  findCustomerBySessionId,
  getBookings,
  getProfileByEmail,
  updateProfile
}
