import fetch from 'isomorphic-fetch'
import {
  RGBFormat,
  TextureLoader
} from 'three'
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
const JSON_SKIN_ATTR_KEYS = [
  'bones',
  'boneFrames'
]

const LOG_KEYS = {
  loadModel: '> load model',
  loadSkin: '> load skin'
}

const fetchFloatBuffers = createBufferFetcher(Float32Array)
const fetchIntBuffers = createBufferFetcher(Uint16Array)

export function loadModel (baseUrl, modelJson) {
  logger.time(LOG_KEYS.loadModel)
  const mapBufferUrl = (key) => ({
    key,
    url: formatDestPath(baseUrl, key, 'bin')
  })

  return Promise.all([
    ...FLOAT_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapBufferUrl)
      .map(fetchFloatBuffers),

    ...INT_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapBufferUrl)
      .map(fetchIntBuffers)
  ]).then((resolutions) => resolutions.reduce((props, data) => {
    props[data.key] = data.payload
    return props
  }, {})).then((props) => {
    logger.timeEnd(LOG_KEYS.loadModel)
    return props
  })
}

export function loadSkin (baseUrl, modelJson) {
  logger.time(LOG_KEYS.loadSkin)
  const mapJsonUrl = (key) => ({
    key,
    url: formatDestPath(baseUrl, key, 'json')
  })

  return Promise.all([
    ...JSON_SKIN_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapJsonUrl)
      .map(fetchJson)
  ]).then((resolutions) => resolutions.reduce((props, data) => {
    props[data.key] = data.payload
    return props
  }, {})).then((props) => {
    logger.timeEnd(LOG_KEYS.loadSkin)
    return props
  })
}

function createBufferFetcher (BufferCtor) {
  return ({key, url}) => new Promise((resolve, reject) => {
    const logKey = `-  fetch ${key}`
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
  const logKey = `-  fetch ${key}`
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

// TODO: Detect WebP support
let textureLoader
export function loadTexture (src) {
  if (!textureLoader) textureLoader = new TextureLoader()
  const texture = textureLoader.load(src + '.jpg')
  texture.format = RGBFormat
  return texture
}
