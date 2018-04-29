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
  constructor (provider) {
    this.provider = provider
  }

  async login (login, password) {
    const user = await this.provider.login(this.provider.dbNames.customerName, { _id: login, password: password })
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
    const now = new Date();
    const later = new Date(now.getTime() + 1000*60*60*24);
      
    const document = { "_id" : uuid.v4(), "customerid" : customerId, "lastAccessedTime" : now, "timeoutTime" : later };
  
    try {
      await this.provider.insertOne(this.provider.dbNames.customerSessionName, document)
      return document._id
    }
    catch (error) {
      throw Boom.badImplementation();
    }
  }

  async invalidateSession(sessionid) {
    if (this.authService){
        this.authService.invalidateSession(sessionid, callback);
        return;
    }    
    await this.provider.remove(this.provider.dbNames.customerSessionName, {'_id':sessionid}) 
  }

  async countItems(dbName) {
    try {
      const count = await this.provider.count(dbName, {})
      return count;  
    }
    catch (error) {
      throw (error)
    }
  };
  
  async validateSession(sessionId) {
    if (this.authService){
      this.authService.validateSession(sessionId, callback);
      return;
    }
    const now = new Date();
    try {
      const session = await this.provider.findOne(this.provider.dbNames.customerSessionName, sessionId)
      if (now > session.timeoutTime) {
        try {
          await this.provider.remove(this.provider.dbNames.customerSessionName, {'_id': sessionId})
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
      const docs = await this.provider.findBy(dbName, condition) //.toArray()
      return docs
    }
    catch (error) {
      return null
    }
  }

  async insertOne(dbName, doc) {
    try {
      await this.provider.insertOne(dbName, doc)
    }
    catch (error) {
      // logger.error("insertOne hit error:"+error);
    }
  }

  async remove (dbName, condition) {
    const numDocs = await this.provider.remove(dbName, {_id: condition._id})
    return
  }

  async findOne(dbName, key) {
    return await this.provider.findOne(dbName, key)
  }

  async update(dbName, doc) {
    try {
      const numUpdates = await this.provider.update(dbName, doc)
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
