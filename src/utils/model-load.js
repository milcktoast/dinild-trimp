import fetch from 'isomorphic-fetch'
import {
  TextureLoader
} from 'three'
import { basename } from 'path'
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
  loadModel: 'load model',
  loadSkin: 'load skin'
}

const fetchFloatBuffers = createBufferFetcher(Float32Array)
const fetchIntBuffers = createBufferFetcher(Uint16Array)

export function loadModel (baseUrl, modelJson) {
  const timeKey = `${LOG_KEYS.loadModel} ${basename(baseUrl)}`
  const mapBufferUrl = (key) => ({
    key,
    url: formatDestPath(baseUrl, key, 'bin')
  })

  logger.time(timeKey)
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
    logger.timeEnd(timeKey)
    return props
  })
}

export function loadSkin (baseUrl, modelJson) {
  const timeKey = `${LOG_KEYS.loadSkin} ${basename(baseUrl)}`
  const mapJsonUrl = (key) => ({
    key,
    url: formatDestPath(baseUrl, key, 'json')
  })

  logger.time(timeKey)
  return Promise.all([
    ...JSON_SKIN_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map(mapJsonUrl)
      .map(fetchJson)
  ]).then((resolutions) => resolutions.reduce((props, data) => {
    props[data.key] = data.payload
    return props
  }, {})).then((props) => {
    logger.timeEnd(timeKey)
    return props
  })
}

function createBufferFetcher (BufferCtor) {
  return ({key, url}) => new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => resolve({
        key,
        payload: new BufferCtor(buffer)
      }))
  })
}

function fetchJson ({key, url}) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.json())
      .then((json) => resolve({
        key,
        payload: json
      }))
  })
}

function formatDestPath (baseUrl, key, ext) {
  return `${baseUrl}/${key}.${ext}`
}

// TODO: Detect WebP support
let textureLoader
export function loadTexture (src) {
  if (!textureLoader) textureLoader = new TextureLoader()
  return new Promise((resolve, reject) => {
    textureLoader.load(src + '.jpg', resolve)
  })
}
