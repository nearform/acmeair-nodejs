'use strict'
const isEqual = require('date-fns/is_equal')
const parse = require('date-fns/parse')
var format = require('date-fns/format')

const { find } = require('../db/mongo')

const show = async (options, context) => {
  const { dbClient, log } = options
  const origin = (context.fromAirport) ? context.fromAirport : undefined
  const destination = (context.toAirport) ? context.toAirport : undefined
  const outbound = parse(context.fromDate)
  const inbound = (isEqual(context.fromDate, context.toDate)) ? undefined : context.toDate 

  let originAirportCodes = []
  // if we have an origin, apply it to our query
  if (origin) {
    originAirportCodes.push(origin)
  } else {
    // pull all airport codes that our flights originates from
    const originAirports = await find(dbClient, 'airportCodeMapping', {originPort: true})
    originAirportCodes = originAirports.data.map((airport) => airport._id)
  }

  const originFlightSegments = await find(dbClient, 'flightSegment', {originPort: {'$in': originAirportCodes}} )
  const originFlightSegmentIds = originFlightSegments.data.map((segment) => segment._id)
  const query = {flightSegmentId: {'$in': originFlightSegmentIds}}

  if (outbound) {
    query.scheduledDepartureTime = { 
      $gte: new Date(outbound)
    }
  }
  // TODO:accomodate return dates in query?
  const results = await find(dbClient, 'flight', query)

  return results
}

// currently only looks up the flight segments we load, which all 
// originate in the same place for outbound and return...
// no way to BOM => AMS and return AMS => BOM
const findBySegmentId = async (options, context) => {
  const { dbClient, log } = options
  const { 
    flightSegmentId,
    flightId,
    outboundArrivalTime
  } = context
  let results = {data: []}

  if (flightSegmentId) {
    const flightSegment = await find(dbClient, 'flightSegment', {_id: flightSegmentId} )
    const query = {
      flightSegmentId,
      scheduledDepartureTime: { 
        $gte: new Date(outboundArrivalTime)
      }
    }

    results = await find(dbClient, 'flight', query)
    results.meta = flightSegment.data.pop()
  }

  return results
}

const findFlightSegmentByFlightId = async (options, context) => {
  const { dbClient, log } = options
  const { flightId } = context
  let results = {data: []}

  if (flightId) {
    const flight = await find(dbClient, 'flight', {_id: flightId})
    const flightSegmentId = (flight.data && flight.data[0]) ? flight.data[0].flightSegmentId : ''
    results = await find(dbClient, 'flightSegment', {_id: flightSegmentId} )
  }

  return results
}

module.exports = {
  show,
  findBySegmentId,
  findFlightSegmentByFlightId
}