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
  return logger
}

const logger = createLogger()
export { logger }
