'use strict'

const {
  deleteOne,
  find,
  update
} = require('../db')

const getSession = async (options, context) => {
  const query = {
    _id: (context.sessionId) ? context.sessionId : ''
  }

  const result = await find(options, {collectionName: 'customerSession', query})

  return result
}

const getProfile = async (options, context) => {
  const query = {
    _id: (context.customerId) ? context.customerId : ''
  }
  const result = await find(options, {collectionName: 'customer', query})

  return result
}

const getProfileByEmail = async (options, context) => {
  const query = {
    email: (context.email) ? context.email : ''
  }
  const results = await find(options, {collectionName: 'customer', query})

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

  const results = await update(options, {collectionName: 'customer', query: {_id: context._id}, doc})

  return results
}

const getBookings = async (options, context) => {
  const { customerId } = context

  const results = await find(options, {collectionName: 'booking', query: {customerId}})

  return results
}

const cancelBooking = async (options, context) => {
  const results = await deleteOne(options, {collectionName: 'booking', query: context})

  return results
}

module.exports = {
  cancelBooking,
  findCustomerBySessionId,
  getBookings,
  getProfileByEmail,
  updateProfile
}
