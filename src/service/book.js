'use strict'
const uuidv4 = require('uuid/v4');
const { insertOne } = require('../db/mongo')
const { findFlightSegmentByFlightId } = require('./flights')

// adds a booking
const flight = async (options, context) => {
  const { dbClient, log } = options
  const doc = Object.assign({_id: uuidv4(), created: new Date()}, context)

  const flightSegment = await findFlightSegmentByFlightId(options, {flightId: context.outboundFlightId})
  const results = await insertOne(dbClient, 'booking', doc)

  results.meta = flightSegment.data.pop()

  return results
}

module.exports = {
  flight
}