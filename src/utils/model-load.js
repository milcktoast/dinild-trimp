import fetch from 'isomorphic-fetch'
import { logger } from './logger'

const FLOAT_ATTR_KEYS = [
  'normals',
  'skinWeights',
  'uvs',
  'vertices'
]
const INT_ATTR_KEYS = [
  'faces',
  'skinIndices'
]
const JSON_ATTR_KEYS = [
  'bones',
  'boneFrames'
]

const LOG_KEYS = {
  loadModel: 'load model'
}

const fetchFloatBuffers = createBufferFetcher(Float32Array)
const fetchIntBuffers = createBufferFetcher(Uint16Array)

export function loadModel (baseUrl, modelJson) {
  logger.time(LOG_KEYS.loadModel)
  const mapBufferUrl = (key) => ({
    key,
    url: formatDestPath(baseUrl, key, 'bin')
  })
  const mapJsonUrl = (key) => ({
    key,
    url: formatDestPath(baseUrl, key, 'json')
  })

  return Promise.all([
    ...FLOAT_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapBufferUrl)
      .map(fetchFloatBuffers),

    ...INT_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapBufferUrl)
      .map(fetchIntBuffers),

    ...JSON_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapJsonUrl)
      .map(fetchJson)
  ]).then((resolutions) => resolutions.reduce((props, data) => {
    props[data.key] = data.payload
    return props
  }, {})).then((props) => {
    logger.timeEnd(LOG_KEYS.loadModel)
    return props
  })
}

function createBufferFetcher (BufferCtor) {
  return ({key, url}) => new Promise((resolve, reject) => {
    const logKey = `| fetch ${key}`
    logger.time(logKey)
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => resolve({
        key,
        payload: new BufferCtor(buffer)
      })).then((resolution) => {
        logger.timeEnd(logKey)
        return resolution
      })
  })
}

function fetchJson ({key, url}) {
  const logKey = `| fetch ${key}`
  return new Promise((resolve, reject) => {
    logger.time(logKey)
    fetch(url)
      .then((res) => res.json())
      .then((json) => resolve({
        key,
        payload: json
      })).then((resolution) => {
        logger.timeEnd(logKey)
        return resolution
      })
  })
}

function formatDestPath (baseUrl, key, ext) {
  return `${baseUrl}/${key}.${ext}`
}
