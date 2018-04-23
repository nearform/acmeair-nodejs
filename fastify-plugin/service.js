/*******************************************************************************
* Copyright (c) 2018 nearForm
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
'use strict'

const Boom = require('boom')
const DUPLICATE_KEY_ERROR_CODE = 11000
const uuid = require('node-uuid')

class Service {
  constructor (dataAccess, provider) {
    this.dataAccess = dataAccess
    this.provider = provider
  }

  async login (login, password) {
    // const user = await this.userCollection.findOne({ _id: login, password: password })
    const user = await this.dataAccess.db.collection(this.provider.dbNames.customerName).findOne({ _id: login, password: password })
    if (!user) throw Boom.badData('Check your username')

    if (!user || user.password !== password) throw Boom.badData('Wrong credentials')

    try {
      const sessiondid = await this.createSession(login)
      return sessiondid
    }
    catch (error) {
      throw Boom.badImplementation();
    }
  }

  async logout (sessionid) {
    await this.invalidateSession(sessionid);
  }

  async createSession(customerId) {
    if (this.authService){
      this.authService.createSession(customerId,callback);
      return;
    }
    var now = new Date();
    var later = new Date(now.getTime() + 1000*60*60*24);
      
    var document = { "_id" : uuid.v4(), "customerid" : customerId, "lastAccessedTime" : now, "timeoutTime" : later };
  
    try {
      await this.dataAccess.db.collection(this.provider.dbNames.customerSessionName).insertOne(document)
      return document._id
    }
    catch (error) {
      console.log('error:', error)
      throw Boom.badImplementation();
    }
  }

  async invalidateSession(sessionid) {
    if (this.authService){
        this.authService.invalidateSession(sessionid, callback);
        return;
    }    
    this.dataAccess.db.collection(this.provider.dbNames.customerSessionName).remove({'_id':sessionid}) 
  }

  async countItems(dbName) {
    const count = await this.dataAccess.db.collection(dbName).count({});
    return count;
  };
  
  async validateSession(sessionId) {
    if (this.authService){
      this.authService.validateSession(sessionId, callback);
      return;
    }
    const now = new Date();
    try {
      const session = await this.dataAccess.db.collection(this.provider.dbNames.customerSessionName).findOne({ _id: sessionId})
      if (now > session.timeoutTime) {
        try {
          await this.dataAccess.db.collection(this.provider.dbNames.customerSessionName).remove({'_id':sessionId})
          return null;
        }
        catch (error) {
          console.log('error:', error)
        }
      } else {
        return session.customerid
      }
    }
    catch (error) {
      console.log('error:', error)
    }
  }

  async findBy(dbName, condition) {
    try {
      const docs = await this.dataAccess.db.collection(dbName).find(condition).toArray()
      return docs
    }
    catch (error) {
      return null
    }
  }

  async insertOne(dbName, doc) {
    try {
      await this.dataAccess.db.collection(dbName).insert(doc, {safe: true})
    }
    catch (error) {
      // logger.error("insertOne hit error:"+error);
    }
  }

  async remove (dbName, condition) {
    const numDocs = await this.dataAccess.db.collection(dbName).remove({_id: condition._id}, {safe: true})
  }

  async findOne(dbName, key) {
    return await this.dataAccess.db.collection(dbName).findOne({_id: key})
  }

  async update(dbName, doc) {
    try {
      const numUpdates = await this.dataAccess.db.collection(dbName).update({_id: doc._id}, doc, {safe: true})
      // logger.debug(numUpdates);
      return doc
    }
    catch (e) {
      // logger.debug('error:', e)
      console.log('error:', e)
      throw e
    }
  }
}

module.exports = Service
