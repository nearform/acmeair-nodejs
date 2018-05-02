/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 * Copyright (c) 2018 nearForm.
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
//		count(collname, condition as json of field and value, function(error, count))

module.exports = function(dbaccess) {
  const dbclient = dbaccess.db;
  var module = {};

  module.dbNames = {
    customerName: 'customer',
    flightName: 'flight',
    flightSegmentName: 'flightSegment',
    bookingName: 'booking',
    customerSessionName: 'customerSession',
    airportCodeMappingName: 'airportCodeMapping',
  };

  module.insertOne = async (collectionname, doc) => {
    const collection = dbclient.collection(collectionname);
    const res = await collection.insert(doc, { safe: true });
    return;
  };

  module.login = async (collectionname, filter) => {
    const collection = dbclient.collection(collectionname);
    const user = await collection.findOne(filter);
    return user;
  };

  module.findOne = async (collectionname, key) => {
    const collection = dbclient.collection(collectionname);
    const docs = await collection.find({ _id: key }).toArray();
    const doc = docs[0];
    if (!doc) {
      logger.debug('Not found:' + key);
    }
    return doc;
  };

  module.update = async (collectionname, doc) => {
    const collection = dbclient.collection(collectionname);
    const numUpdates = await collection.update({ _id: doc._id }, doc, {
      safe: true,
    });
    return numUpdates;
  };

  module.remove = async (collectionname, condition) => {
    const collection = dbclient.collection(collectionname);
    const numDocs = await collection.remove(
      { _id: condition._id },
      { safe: true }
    );
    return;
  };

  module.findBy = async (collectionname, condition) => {
    const collection = dbclient.collection(collectionname);
    const docs = await collection.find(condition).toArray();
    return docs;
  };

  module.count = async (collectionname, condition) => {
    const collection = dbclient.collection(collectionname);
    const count = await collection.count(condition);
    return count;
  };

  return module;
};
