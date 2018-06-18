'use strict'

const MongoDB = require('./mongo')
const CouchDB = require('./couch-db')

const determineDbService = (dbType) => {
  switch(dbType) {
    case 'couch':
      return CouchDB
    default:
      return MongoDB
  }
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

module.exports = {
  deleteOne,
  dropCollection,
  find,
  insertMany,
  insertOne,
  update
}
