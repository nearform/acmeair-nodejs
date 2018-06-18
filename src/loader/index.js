'use strict'
const fs = require('fs')
const path = require('path')
const parse = require('csv-parse')

const filePath = path.join(__dirname, './data/mileage.csv')
const airports = require('./data/airports')

const {
  customerTemplate,
  flightSegmentTemplate,
  flightTemplate
} = require('./data-templates')

const {
  dropCollection,
  find,
  insertMany
} = require('../db')

const airportCodes = 'airportCodeMapping'
const flightSegment = 'flightSegment'

const loadCustomers = async (options, count) => {
  const { log } = options
  const customers = []

  await dropCollection(options, {collectionName: 'customer'})

  log.info({msg: `loading ${count} customers`})

  for (let i = 0; i < count; i++) {
    customers.push(Object.assign({}, customerTemplate(i)))
  }

  await insertMany(options, {collectionName: 'customer', documents: customers})

  return 'done'
}

const loadAirportCodes = async (options) => {
  const { log } = options

  log.info({msg: `loading ${airports.length} airports`, collection: airportCodes})
  // to avoid primary key conflicts
  await dropCollection(options, {collectionName: airportCodes})
  await insertMany(options, {collectionName: airportCodes, documents: airports})

  return 'done'
}

const loadFlightSegments = async (options) => {
  return new Promise(async (resolve, reject) => {
    const { log } = options
    const segments = []
    const originPorts = await find(options, {collectionName: airportCodes, query: {originPort: true}})
    let segmentCount = 0

    // to avoid primary key conflicts
    await dropCollection(options, {collectionName: flightSegment})

    fs.createReadStream(filePath)
      .pipe(parse())
      .on('data', (row) => {
        const destinationPortCode = row[1]

        originPorts.data.forEach((originPort, index) => {
          const mileage = row[index + 2]
          const segmentId = `AA${segmentCount++}`
          segments.push(flightSegmentTemplate(segmentId, originPort._id, destinationPortCode, mileage))
        })
      })
      .on('end', async () => {
        log.info({msg: `loading ${segments.length} flight segments`})
        await insertMany(options, {collectionName: flightSegment, documents: segments})

        return resolve('done')
      })
  })
}

// for each flight segment
//  for today until X days out
//    schedule Y number of flights
const loadFlights = async (options) => {
  return new Promise(async (resolve, reject) => {
    const { log, config } = options
    const { maxDaysToScheduleFlights } = config
    const flights = []
    const flightSegments = await find(options, {collectionName: flightSegment, query: {}})

    await dropCollection(options, {collectionName: 'flight'})

    log.info({msg: `loading ${flightSegments.data.length * maxDaysToScheduleFlights} flights`})

    flightSegments.data.forEach((segment) => {
      for (let daysFromToday = 0; daysFromToday <= maxDaysToScheduleFlights; daysFromToday++) {
        flights.push(flightTemplate(segment._id, segment.miles, daysFromToday))
      }
    })

    if (flights.length) {
      await insertMany(options, {collectionName: 'flight', documents: flights})
    }

    return resolve('done')
  })
}

const load = async (options, count) => {
  await loadCustomers(options, count)
  await loadAirportCodes(options)
  await loadFlightSegments(options)
  await loadFlights(options)

  return 'done'
}

module.exports = {
  load
}
