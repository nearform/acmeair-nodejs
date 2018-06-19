'use strict'
const { count } = require('../db')

const collectionCount = async (options, collectionName) => {
  const result = await count(options, collectionName, {})
  return result
}

module.exports = {
  collectionCount
}
