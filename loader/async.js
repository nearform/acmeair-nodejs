module.exports = function () {
  module.internalQueue = []
  module.func = undefined
  module.parallelism =  1

  const process = async () => {
      const pickUpNextTask = () => {
        if (module.internalQueue.length) {
          return module.func(module.internalQueue.shift())
        }
      }
      const startChain = () => {
        return Promise.resolve().then(function next() {
          return pickUpNextTask().then(next)
        })
      }
      let chains = []
      for (let k = 0; k < module.parallelism; k += 1) {
        chains.push(startChain());
      }
      await Promise.all(chains)
      module.drain()
  }

  module.queue = (func, parallelism = 1) => {
      module.func = func
      module.parallelism = parallelism
      return module
  }

  module.push = async (customers) => {
      module.internalQueue.push(customers)
      await process()
  }

  module.drain = () => {}

  return module
}
/*
class async extends Object {
  constructor() {
    this.internalQueue = []
    this.propertyIsEnumerable = 1
    this.func = undefined
    this.drain = () => {}
  }

  static queue(func, parallelism = 1) {
    const o = new async()
    o.func = func
    o.parallelism = parallelism
    return o
  }

  async push(q) {
    this.internalQueue.push(q)
    await process()
  }

  async process() {
    const pickUpNextTask = () => {
      if (this.internalQueue.length) {
        return this.func(this.internalQueue.shift())
      }
    }
    const startChain = () => {
      return Promise.resolve().then(function next() {
        return pickUpNextTask().then(next)
      })
    }
    let chains = []
    for (let k = 0; k < module.parallelism; k += 1) {
      chains.push(startChain());
    }
    await Promise.all(chains)
    this.drain()
  }
}

module.exports = async
*/
