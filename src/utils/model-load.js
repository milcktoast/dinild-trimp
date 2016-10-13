import fetch from 'isomorphic-fetch'

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

const fetchFloatBuffers = createBufferFetcher(Float32Array)
const fetchIntBuffers = createBufferFetcher(Uint16Array)

export function loadModel (baseUrl, modelJson) {
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
  }, {}))
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
