'use strict'
// const isEqual = require('date-fns/is_equal')
const parse = require('date-fns/parse')

const { find, names } = require('../db')

const show = async (options, context) => {
  const origin = (context.fromAirport) ? context.fromAirport : undefined
  const outbound = parse(context.fromDate)
  // const destination = (context.toAirport) ? context.toAirport : undefined
  // const inbound = (isEqual(context.fromDate, context.toDate)) ? undefined : context.toDate

  let originAirportCodes = []
  // if we have an origin, apply it to our query
  if (origin) {
    originAirportCodes.push(origin)
  } else {
    // pull all airport codes that our flights originates from
    const originAirports = await find(options, {collectionName: names.airport, query: {originPort: true}})
    originAirportCodes = originAirports.data.map((airport) => airport._id)
  }

  const originFlightSegments = await find(options, {collectionName: names.flightSegment, query: {originPort: {'$in': originAirportCodes}}})
  const originFlightSegmentIds = originFlightSegments.data.map((segment) => segment._id)
  const query = {flightSegmentId: {'$in': originFlightSegmentIds}}

  if (outbound) {
    query.scheduledDepartureTime = {
      $gte: new Date(outbound)
    }
  }
  // TODO:accomodate return dates in query?
  const results = await find(options, {collectionName: names.flight, query})

  return results
}

// currently only looks up the flight segments we load, which all
// originate in the same place for outbound and return...
// no way to BOM => AMS and return AMS => BOM
const findBySegmentId = async (options, context) => {
  const {
    flightSegmentId,
    outboundArrivalTime
  } = context
  let results = {data: []}

  if (flightSegmentId) {
    const flightSegment = await find(options, {collectionName: names.flightSegment, query: {_id: flightSegmentId}})
    const query = {
      flightSegmentId,
      scheduledDepartureTime: {
        $gte: new Date(outboundArrivalTime)
      }
    }

    results = await find(options, {collectionName: names.flight, query})
    results.meta = flightSegment.data.pop()
  }

  return results
}

const findFlightSegmentByFlightId = async (options, context) => {
  const { flightId } = context
  let results = {data: []}

  if (flightId) {
    const flight = await find(options, {collectionName: names.flight, query: {_id: flightId}})
    const flightSegmentId = (flight.data && flight.data[0]) ? flight.data[0].flightSegmentId : ''
    results = await find(options, {collectionName: names.flightSegment, query: {_id: flightSegmentId}})
  }

  return results
}

module.exports = {
  show,
  findBySegmentId,
  findFlightSegmentByFlightId
}
