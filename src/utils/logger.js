const METHODS = [
  'log',
  'info',
  'time',
  'timeEnd'
]

function createLogger () {
  const logger = {}
  METHODS.forEach((name) => {
    logger[name] = (...args) => console[name](...args)
  })
  logger.logHash = (name, hash) => {
    Object.keys(hash).forEach((key) => {
      console.log(`|  ${key}: ${hash[key]}`)
    })
    console.log(name)
  }
  return logger
}

const logger = createLogger()
export { logger }
