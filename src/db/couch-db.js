'use strict'

const insertOne = async (dbClient, collectionName, document) => {
  // use db
  // db.insert

  const db = dbClient.use(collectionName)
  const results = await db.insert(document)

  console.log(results)

  // const results = await dbClient.db.collection(collectionName).insertOne(document)
  return {insertedId: results.insertedId, data: results.ops}
}

module.exports = {
  insertOne
}