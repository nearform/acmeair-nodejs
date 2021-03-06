'use strict'
const uuidv4 = require('uuid/v4')
const { insertOne, names } = require('../db')
const { findFlightSegmentByFlightId } = require('./flights')

// adds a booking
const flight = async (options, context) => {
  const doc = Object.assign({_id: uuidv4(), created: new Date()}, context)
  const flightSegment = await findFlightSegmentByFlightId(options, {flightId: context.outboundFlightId})
  const results = await insertOne(options, {collectionName: names.booking, doc})

  results.meta = flightSegment.data.pop()

  return results
}

module.exports = {
  flight
}
