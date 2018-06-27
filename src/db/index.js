'use strict'

const MongoDB = require('./mongo')
const CouchDB = require('./couch-db')

const determineDbService = (dbType) => {
  switch (dbType) {
    case 'couch':
      return CouchDB
    default:
      return MongoDB
  }
}

// couchdb has specific naming rules for dbs
// http://docs.couchdb.org/en/2.0.0/api/database/common.html#put--db
const dbNames = {
  airport: 'airport',
  customer: 'customer',
  flightSegment: 'flight_segment',
  flight: 'flight',
  session: 'session',
  booking: 'booking'
}

const deleteOne = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName, query} = context
  const dbService = determineDbService(dbType)

  const results = await dbService.deleteOne(dbClient, collectionName, query)
  return results
}

const find = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName, query} = context
  const dbService = determineDbService(dbType)

  const results = await dbService.find(dbClient, collectionName, query)
  return results
}

const insertOne = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName, doc} = context
  const dbService = determineDbService(dbType)

  const results = await dbService.insertOne(dbClient, collectionName, doc)
  return results
}

const update = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName, query, doc} = context
  const dbService = determineDbService(dbType)

  const result = dbService.update(dbClient, collectionName, query, doc)
  return result
}

const dropCollection = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName} = context
  const dbService = determineDbService(dbType)

  const results = dbService.dropCollection(dbClient, collectionName)
  return results
}

const insertMany = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName, documents} = context
  const dbService = determineDbService(dbType)

  const results = await dbService.insertMany(dbClient, collectionName, documents)
  return results
}

const count = async (options, context) => {
  const {dbClient, dbType} = options
  const {collectionName, query} = context
  const dbService = determineDbService(dbType)

  const results = await dbService.count(dbClient, collectionName, query)
  return results
}

const createCollection = async (options, context) => {
  // mongo can create collections on insert
  if (options.dbType === 'mongo') { return 'done' }

  const {dbClient, dbType} = options
  const {collectionName} = context
  const dbService = determineDbService(dbType)

  const results = dbService.createCollection(dbClient, collectionName)
  return results
}

const createIndices = async (options, context) => {
  // only intended for mongo, related to benchmark queries
  if (options.dbType !== 'mongo') { return 'done' }

  const {dbClient, dbType} = options
  const dbService = determineDbService(dbType)
  const results = dbService.createIndices(dbClient, context)
  return results
}

module.exports = {
  count,
  deleteOne,
  createCollection,
  dropCollection,
  find,
  insertMany,
  insertOne,
  update,
  names: dbNames,
  createIndices
}
