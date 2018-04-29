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

module.exports = function (dbaccess) {
	const dbclient = dbaccess.db
    var module = {};

	var log4js = require('log4js');
	
	var logger = log4js.getLogger('dataaccess/mongo');
//	logger.setLevel(settings.loggerLevel);

	module.dbNames = {
		customerName: "customer",
		flightName:"flight",
		flightSegmentName:"flightSegment",
		bookingName:"booking",
		customerSessionName:"customerSession",
		airportCodeMappingName:"airportCodeMapping"
	}

	module.insertOne = async (collectionname, doc) => {
	  try {
		const collection = dbclient.collection(collectionname)
		const res = await collection.insert(doc, {safe: true})
		return
	  }
	  catch (error) {
		logger.error("insertOne hit error:"+error);
		throw (error)		
	  }
	};

	module.login = async (collectionname, filter) => {
	  try {
  		const collection = dbclient.collection(collectionname)
	  	const user = await collection.findOne(filter)
		  return user
	  }
	  catch (error) {
  		throw (error)
	  }
	}

	module.findOne = async (collectionname, key) => {
	  try {
		  const collection = dbclient.collection(collectionname)
	    const docs = await collection.find({_id: key}).toArray()
	    const doc = docs[0];
        if (!doc) {
	      logger.debug("Not found:"+key);
		}
		return doc
	  }
	  catch (err) {
	    logger.error('error:', err)
	    throw (err)
	  }
	};

	module.update = async (collectionname, doc) => {
	  try {
		const collection = dbclient.collection(collectionname)
		const numUpdates = await collection.update({_id: doc._id}, doc, {safe: true})
		return numUpdates
	  }
	  catch (error) {
		logger.error("update hit error:"+error)
		throw (error)
	  }
	};

	module.remove = async (collectionname, condition) => {
	  try {
		const collection = dbclient.collection(collectionname)
		const numDocs = await collection.remove({_id: condition._id}, {safe: true})
		return
	  }
	  catch (err) {
		logger.error("remove hit error:"+err)
		throw (err)
	  }
	};

	module.findBy = async (collectionname,condition) => {
		try {
		  const collection = dbclient.collection(collectionname)
		  const docs = await collection.find(condition).toArray()
		  return docs
		}
		catch (error) {
		  logger.error("findBy hit error:"+error)
		  throw (error)
		}
	};
	
	module.count = async (collectionname, condition) => {
	  try {
		const collection = dbclient.collection(collectionname)
		const count = await collection.count(condition)
		return count
	  }
	  catch (error) {
		logger.error("count hit error:"+error)
		throw (error)
	  }
	};
	
	return module;
}
