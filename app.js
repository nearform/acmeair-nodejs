/*******************************************************************************
* Copyright (c) 2015 IBM Corp.
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

const path = require('path')

module.exports = async (fastify, opts) => {
  fastify
    .register(require('fastify-cookie'))
    .register(require('fastify-formbody'))
    .register(require('./src/plugins/determine-env'))
    .register(require('./src/plugins/configure-db'))
    .register(require('./src/routes/loader'))
    .register(require('./src/routes/config'))
    .register(require('./src/routes/auth'))
    .register(require('./src/routes/customer'))
    .register(require('./src/routes/flights'))
    .register(require('./src/routes/book'))

    .register(require('fastify-static'), {
      root: path.join(__dirname, 'public'),
      prefix: '/'
    })
}
