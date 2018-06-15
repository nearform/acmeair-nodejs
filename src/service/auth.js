'use strict'
var format = require('date-fns/format')
const uuidv4 = require('uuid/v4');
const addHours = require('date-fns/add_hours')

const { find,
  insertOne,
  deleteOne
} = require('../db/mongo')
const { getProfileByEmail } = require('./customer')

const createSession = async (options, context) => {
  const { dbClient } = options
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

  const result = await insertOne(dbClient, 'customerSession', doc)
  const _expires = (result.data[0]) ? result.data[0].expires : lastAccessed
  const _customerId = (result.data[0]) ? result.data[0].customerId : ''

  return {
    sessionId: result.insertedId,
    expires: _expires,
    customerId: _customerId,
    email: context.login
  }
}

const deleteSession = async (options, context) => {
  const { dbClient } = options
  const sessionId = (context.sessionId) ? context.sessionId : undefined
  const results = await deleteOne(dbClient, 'customerSession', {_id: sessionId})  

  return results
}

module.exports = {
  createSession,
  deleteSession
}