'use strict'

const { count } = require('../db/mongo')

const collectionCount = async (options, collectionName) => {
  const { dbClient, log } = options
  const result = await count(dbClient, collectionName, {})

  return result
}

module.exports = {
  collectionCount
}