'use strict'

const dbDestroy = (dbClient, collectionName) => {
  return new Promise((resolve, reject) => {
    dbClient.db.destroy(collectionName, (err, response) => {
      if (err &&
        err.statusCode &&
        err.statusCode !== 404) {
        return reject(err)
      }

      return resolve(response)
    })
  })
}

const dbCreate = (dbClient, collectionName) => {
  return new Promise((resolve, reject) => {
    dbClient.db.create(collectionName, (err, response) => {
      if (err &&
        err.statusCode &&
        err.statusCode !== 412) {
        return reject(err)
      }

      return resolve(response)
    })
  })
}

const docBulk = async (dbClient, collectionName, documents) => {
  const db = await dbClient.use(collectionName)

  return new Promise((resolve, reject) => {
    db.bulk({docs: documents}, (err, response) => {
      if (err) {
        return reject(err)
      }

      return resolve(response)
    })
  })
}

const docInsert = async (dbClient, collectionName, documents) => {
  const db = await dbClient.use(collectionName)

  return new Promise((resolve, reject) => {
    db.insert({docs: documents}, (err, response) => {
      if (err) {
        return reject(err)
      }

      return resolve(response)
    })
  })
}

const docDestroy = async (dbClient, collectionName, query) => {
  const db = await dbClient.use(collectionName)

  return new Promise((resolve, reject) => {
    db.destroy(query._id, (err, response) => {
      if (err) {
        return reject(err)
      }

      return resolve(response)
    })
  })
}

const _find = async (dbClient, collectionName, query) => {
  const _query = {'selector': query}

  return new Promise((resolve, reject) => {
    dbClient.request({
      db: collectionName,
      doc: '_find',
      method: 'POST',
      body: _query
    }, (err, response) => {
      if (err) { return reject(err) }
      const data = (response.docs) ? response.docs : []
      return resolve(data)
    })
  })
}

const _get = async (dbClient, collectionName, query) => { // eslint-disable-line
  const db = await dbClient.use(collectionName)

  return new Promise((resolve, reject) => {
    db.get(query._id, (err, response) => {
      if (err && err.statusCode !== 404) {
        return reject(err)
      }

      return resolve({data: response})
    })
  })
}

const _list = async (dbClient, collectionName) => {
  const db = await dbClient.use(collectionName)

  return new Promise((resolve, reject) => {
    db.list((err, response) => {
      if (err && err.statusCode !== 404) {
        return reject(err)
      }

      return resolve({data: response})
    })
  })
}

const dropCollection = async (dbClient, collectionName) => {
  await dbDestroy(dbClient, collectionName)
  await dbCreate(dbClient, collectionName)

  return 'done'
}

const insertMany = async (dbClient, collectionName, documents) => {
  const results = await docBulk(dbClient, collectionName, documents)
  const insertedIds = results.map((item) => item.id)

  return {insertedIds, data: []}
}

const insertOne = async (dbClient, collectionName, document) => {
  const insertResults = await docInsert(dbClient, collectionName, document)
  const insertedId = insertResults.id
  const results = await find(dbClient, collectionName, {_id: insertedId})
  const data = (results.data && results.data[0]) ? [results.data[0].docs] : []

  return {insertedId, data}
}

const find = async (dbClient, collectionName, query) => {
  let data = []

  try {
    data = await _find(dbClient, collectionName, query)
  } catch (err) {
    console.log(err)
  }

  return {data}
}

const count = async (dbClient, collectionName, query) => {
  const result = await _list(dbClient, collectionName)
  const count = (result.data && result.data.total_rows) ? result.data.total_rows : 0

  return {data: count}
}

const createCollection = async (dbClient, collectionName) => {
  await dbCreate(dbClient, collectionName)
  return 'done'
}

const deleteOne = async (dbClient, collectionName, query) => {
  try {
    // TODO: couch leaves documents in place with _deleted: true
    // need to make sure this doesn't break the queries we run
    // related to a session.
    await docDestroy(dbClient, collectionName, query)
  } catch (err) {
    console.log(err)
  }

  return {success: true}
}

module.exports = {
  createCollection,
  deleteOne,
  dropCollection,
  find,
  insertMany,
  insertOne,
  count
}
