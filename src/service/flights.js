'use strict'
// const isEqual = require('date-fns/is_equal')
const parse = require('date-fns/parse')

const { find, names } = require('../db')

const show = async (options, context) => {
  let originFlightSegments, flightSegmentQuery, flightQuery, results
  const {cache} = options
  const origin = (context.fromAirport) ? context.fromAirport : undefined
  const destination = (context.toAirport) ? context.toAirport : undefined
  const outbound = parse(context.fromDate)
  const segmentsCacheKey = `segments-${origin}-${destination}`
  const flightsCacheKey = `flights-${origin}-${destination}`
  // const inbound = (isEqual(context.fromDate, context.toDate)) ? undefined : context.toDate

  // if we have an origin, no outbound, lookup by originPort
  // if we have an origin and destination, lookup by originPort destPort
  // if we do not have an origin or destination, lookup all originPorts
  if (origin && !destination) {
    flightSegmentQuery = {originPort: origin}
  } else if (origin && destination) {
    flightSegmentQuery = {originPort: origin, destPort: destination}
  } else {
    const originAirports = await find(options, {collectionName: names.airport, query: {originPort: true}})
    const originAirportCodes = originAirports.data.map((airport) => airport._id)

    flightSegmentQuery = {originPort: {'$in': originAirportCodes}}
  }

  if (cache.get(segmentsCacheKey)) {
    originFlightSegments = [].concat(cache.get(segmentsCacheKey))
  } else {
    originFlightSegments = await find(options, {collectionName: names.flightSegment, query: flightSegmentQuery})
    cache.set(segmentsCacheKey, [].concat(originFlightSegments.data))
  }

  if (origin && destination) {
    const flightSegment = (originFlightSegments.data) ? originFlightSegments.data.pop() : originFlightSegments.pop()
    
    flightQuery = {flightSegmentId: flightSegment._id}
  } else {
    const originFlightSegmentIds = originFlightSegments.data.map((segment) => segment._id)
    flightQuery = {flightSegmentId: {'$in': originFlightSegmentIds}}
  }

  if (outbound) {
    flightQuery.scheduledDepartureTime = {
      $gte: new Date(outbound)
    }
  }

  if (cache.get(flightsCacheKey)) {
    results = cache.get(flightsCacheKey)
  } else {
    results = await find(options, {collectionName: names.flight, query: flightQuery})
    cache.set(flightsCacheKey, results)
  }

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
