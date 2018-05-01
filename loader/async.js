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

module.exports = function () {
  const template = {
    internalQueue: [],
    parallelism: 1,
    func: {},
    process: async function() {
      const pickUpNextTask = () => {
        if (this.internalQueue.length) {
          return this.func(this.internalQueue.shift())
        } else {
          return Promise.reject()
        }
      }
      const startChain = () => {
        return Promise.resolve()
                .then(function next() {
                  return pickUpNextTask()
                    .then(next)
                    .catch(() => {
                      return Promise.resolve()
                    })
                })
      }
      let chains = []
      for (let k = 0; k < this.parallelism; k += 1) {
        chains.push(startChain())
      }
      await Promise.all(chains)
      this.drain()
    },
    push: async function (q) {
      this.internalQueue = q.slice()
      await this.process()
    },
    drain: function() {}
  }

  module.queue = function (func, parallelism = 1) {
    const o = Object.assign({}, template, {func: func, parallelism: parallelism})
    return o
  }

  return module
}()
