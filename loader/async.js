module.exports = function () {
  module.internalQueue = []
  module.func = undefined
  module.parallelism =  1

  const process = async () => {
      for (let i = 0; i < module.internalQueue.length; i += module.parallelism) {
        for (let j = 0; j < module.parallelism; j++) {
          let q = []
          if (module.internalQueue[i + j]) {
            q.push(module.func(module.internalQueue[i + j]))
          }
          await Promise.all(q)
        }
      }
      module.internalQueue = []
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
