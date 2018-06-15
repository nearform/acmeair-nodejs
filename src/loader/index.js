'use strict'
const fs = require('fs')
const path = require('path')
const parse = require('csv-parse')
const addDays = require('date-fns/add_days')

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
  insertOne,
  insertMany
} = require('../db/mongo')

const airportCodes = 'airportCodeMapping'
const flightSegment = 'flightSegment'

const loadCustomers = async (options, count) => {
  const { dbClient, log } = options
  const customers = []

  await dropCollection(dbClient, 'customer')

  log.info({msg: `loading ${count} customers`, db: `${dbClient.db.databaseName}`})

  for (let i = 0; i < count; i++) {
    customers.push(Object.assign({}, customerTemplate(i)))
  }

  await insertMany(dbClient, 'customer', customers)
  
  return 'done'
}

const loadAirportCodes = async (options) => {
  const { dbClient, log } = options

  log.info({msg: `loading ${airports.length} airports`, db: `${dbClient.db.databaseName}`, collection: airportCodes})
  // to avoid primary key conflicts
  await dropCollection(dbClient, airportCodes)
  await insertMany(dbClient, airportCodes, airports)

  return 'done'
}

const loadFlightSegments = async (options) => {
  return new Promise( async (resolve, reject) => {
    const { dbClient, log } = options
    const segments = []
    const originPorts = await find(dbClient, airportCodes, {originPort: true})
    let segmentCount = 0

    // to avoid primary key conflicts
    await dropCollection(dbClient, flightSegment)

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
        log.info({msg: `loading ${segments.length} flight segments`, db: `${dbClient.db.databaseName}`})
        await insertMany(dbClient, flightSegment, segments)

        return resolve('done')
      })
  })
}

// for each flight segment 
//  for today until X days out
//    schedule Y number of flights
const loadFlights = async (options) => {
  return new Promise(async (resolve, reject) => {
    const { dbClient, log, config} = options
    const { maxDaysToScheduleFlights } = config
    const flights = []
    const flightSegments = await find(dbClient, flightSegment, {})

    await dropCollection(dbClient, 'flight')
    
    log.info({msg: `loading ${flightSegments.data.length * maxDaysToScheduleFlights} flights`, db: `${dbClient.db.databaseName}`})

    flightSegments.data.forEach((segment) => {
      for (let daysFromToday=0; daysFromToday <= maxDaysToScheduleFlights; daysFromToday++) {
        flights.push(flightTemplate(segment._id, segment.miles, daysFromToday))
      }
    })

    if (flights.length) {
      await insertMany(dbClient, 'flight', flights)
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
