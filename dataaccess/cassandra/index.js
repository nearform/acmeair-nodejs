/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
// Dataaccess must implement
//	 	dbNames:  { customerName:, flightName:, flightSegmentName:, bookingName:, customerServiceName:, airportCodeMappingName:}
// 		initializeDatabaseConnections(function(error))
// 		insertOne(collname, doc, function(error, doc))
// 		findOne(collname, _id value, function(error, doc))
//		update(collname, doc, function(error, doc))
//		remove(collname, condition as json of field and value, function(error))
// 		findBy(collname, condition as json of field and value,function(err, docs))
//		TODO: count(collname, condition as json of field and value, function(error, count))

module.exports = function(dbaccess, logger) {
  const dbclient = dbaccess.client;
  var module = {};

  module.dbNames = {
    customerName: 'n_customer',
    flightName: 'n_flight',
    flightSegmentName: 'n_flightSegment',
    bookingName: 'n_booking',
    customerSessionName: 'n_customerSession',
    airportCodeMappingName: 'n_airportCodeMapping',
  };

  var upsertStmt = {
    n_customer: 'INSERT INTO n_customer (id,content) values (?, ?)',
    n_customerSession:
      'INSERT INTO n_customerSession (id,content) values (?, ?)',
    n_booking: 'INSERT INTO n_booking (customerId,id,content) values (?, ?, ?)',
    n_flight:
      'INSERT INTO n_flight (flightSegmentId,scheduledDepartureTime,id,content) values (?, ?, ?, ?)',
    n_flightSegment:
      'INSERT INTO n_flightSegment (originPort,destPort,id,content) values (?, ?, ?,?)',
    n_airportCodeMapping:
      'INSERT INTO n_airportCodeMapping (id,content) values (?, ?)',
  };

  var findByIdStmt = {
    n_customer: 'SELECT content from n_customer where id=?',
    n_customerSession: 'SELECT content from n_customerSession where id=?',
    n_airportCodeMapping: 'SELECT content from n_airportCodeMapping where id=?',
  };

  function calculateDBConfig() {
    var dbConfig = {};
    if (process.env.CASSANDRA_CP)
      dbConfig.contactPoints = JSON.parse(process.env.CASSANDRA_CP);
    else dbConfig.contactPoints = settings.cassandra_contactPoints;
    dbConfig.keyspace =
      process.env.CASSANDRA_KS ||
      settings.cassandra_keyspace ||
      'acmeair_keyspace';
    logger.info('Cassandra config:' + JSON.stringify(dbConfig));
    return dbConfig;
  }

  module.insertOne = async (collectionname, doc) => {
    try {
      const res = await dbclient.execute(
        upsertStmt[collectionname],
        getUpsertParam(collectionname, doc),
        { prepare: true }
      );
      return doc;
    } catch (err) {
      throw err;
    }
  };

  function getUpsertParam(collectionname, doc) {
    if (collectionname === 'n_booking')
      return [doc.customerId, doc._id, JSON.stringify(doc)];
    if (collectionname === 'n_flight')
      return [
        doc.flightSegmentId,
        doc.scheduledDepartureTime,
        doc._id,
        JSON.stringify(doc),
      ];
    if (collectionname === 'n_flightSegment')
      return [doc.originPort, doc.destPort, doc._id, JSON.stringify(doc)];
    return [doc._id, JSON.stringify(doc)];
  }

  module.findOne = async (collectionname, key) => {
    var query = findByIdStmt[collectionname];
    if (!query) {
      throw 'FindById not supported on ' + collectionname;
    }
    try {
      const result = await dbclient.execute(query, [key], { prepare: true });
      if (result.rows.length) {
        return JSON.parse(result.rows[0].content);
      } else {
        return null;
      }
    } catch (err) {
      throw err;
    }
  };

  module.update = async (collectionname, doc) => {
    try {
      await dbclient.execute(
        upsertStmt[collectionname],
        getUpsertParam(collectionname, doc),
        { prepare: true }
      );
      return doc;
    } catch (err) {
      throw err;
    }
  };

  module.remove = async (collectionname, condition) => {
    const info = getQueryInfo(collectionname, condition);
    const query = 'DELETE from ' + collectionname + ' where ' + info.whereStmt;
    logger.debug('query:' + query + ', param:' + JSON.stringify(info.param));
    try {
      const result = await dbclient.execute(query, info.param, {
        prepare: true,
      });
      return result;
    } catch (err) {
      throw err;
    }
  };

  function getQueryInfo(collectionname, condition) {
    var param = [];
    var whereStmt = '';
    var first = true;
    for (var key in condition) {
      if (!first) whereStmt += ' and ';
      if (key === '_id') whereStmt += 'id=?';
      else whereStmt += key + '=?';
      first = false;
      param.push(condition[key]);
    }
    return { whereStmt: whereStmt, param: param };
  }

  module.findBy = async (collectionname, condition) => {
    const info = getQueryInfo(collectionname, condition);
    const query =
      'SELECT content from ' + collectionname + ' where ' + info.whereStmt;
    logger.debug('query:' + query + ', param:' + JSON.stringify(info.param));
    try {
      const result = await dbclient.execute(query, info.param, {
        prepare: true,
      });
      let docs = [];
      for (let i = 0; i < result.rows.length; i++) {
        logger.debug('result[' + i + ']=' + JSON.stringify(result.rows[i]));
        docs.push(JSON.parse(result.rows[i].content));
      }
      return docs;
    } catch (err) {
      throw err;
    }
  };

  //TODO Implement count method for cassandra -- currently a stub returning -1
  module.count = async (collectionname, condition) => {
    // see https://www.datastax.com/dev/blog/counting-keys-in-cassandra
    return -1;
  };

  module.login = async (collectionname, filter) => {
    try {
      const customer = await module.findOne(collectionname, filter._id);
      if (customer && customer.password === filter.password) {
        return customer;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  return module;
};
