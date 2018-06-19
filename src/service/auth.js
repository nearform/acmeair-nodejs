'use strict'
const format = require('date-fns/format')
const uuidv4 = require('uuid/v4')
const addHours = require('date-fns/add_hours')

const {
  insertOne,
  deleteOne,
  names
} = require('../db')

const { getProfileByEmail } = require('./customer')

const createSession = async (options, context) => {
  const customer = await getProfileByEmail(options, {email: context.login})

  if (customer.data && !customer.data[0]) {
    return {}
  }

  const lastAccessed = format(new Date(), 'YYYY-MM-DDTHH:MM:SS')
  const expires = format(addHours(lastAccessed, 5), 'YYYY-MM-DDTHH:MM:SS')

  const doc = {
    _id: uuidv4(),
    customerId: customer.data[0]._id,
    lastAccessed,
    expires
  }

  const result = await insertOne(options, {collectionName: names.session, doc})
  const _expires = (result.data && result.data[0]) ? result.data[0].expires : lastAccessed
  const _customerId = (result.data && result.data[0]) ? result.data[0].customerId : ''

  return {
    sessionId: result.insertedId,
    expires: _expires,
    customerId: _customerId,
    email: context.login
  }
}

const deleteSession = async (options, context) => {
  const sessionId = (context.sessionId) ? context.sessionId : undefined
  const results = await deleteOne(options, {collectionName: names.session, query: {_id: sessionId}})

  return results
}

module.exports = {
  createSession,
  deleteSession
}
