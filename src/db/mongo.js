'use strict'

const insertOne = async (dbClient, collectionName, document) => {
  const results = await dbClient.db.collection(collectionName).insertOne(document)
  return {insertedId: results.insertedId, data: results.ops}
}

const insertMany = async (dbClient, collectionName, documents) => {
  const results = await dbClient.db.collection(collectionName).insertMany(documents)
  return {insertedIds: results.insertedIds, data: results.ops}
}

const dropCollection = async (dbClient, collectionName) => {
  const collections = await dbClient.db.listCollections({name: collectionName}).toArray()

  if (collections.length) {
    const collection = await dbClient.db.collection(collectionName)
    await collection.drop()
  }
  return 'done'
}

const find = async (dbClient, collectionName, query) => {
  const results = await dbClient.db.collection(collectionName).find(query).toArray()
  return {data: results}
}

const count = async (dbClient, collectionName, query) => {
  const results = await dbClient.db.collection(collectionName).find(query).count()

  return {data: results}
}

const deleteOne = async (dbClient, collectionName, query) => {
  const results = await dbClient.db.collection(collectionName).deleteOne(query)
  const success = (results.deletedCount > 0)

  return {success}
}

const update = async (dbClient, collectionName, query, doc) => {
  const results = await dbClient.db.collection(collectionName).update(query, doc)
  const success = (results.result.nModified === 1)

  return {success, data: doc}
}

const createIndex = async (dbClient, context) => {
  const collection = dbClient.db.collection(context.collectionName)
  await collection.createIndex(context.fields, context.options)
  return 'done'
}

const createIndices = async (dbClient, context) => {
  context.forEach(async (item) => {
    await createIndex(dbClient, item)
  })

  return 'done'
}

module.exports = {
  count,
  deleteOne,
  dropCollection,
  find,
  insertOne,
  insertMany,
  update,
  createIndices
}
