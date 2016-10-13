import fetch from 'isomorphic-fetch'

const FLOAT_ATTR_KEYS = [
  'faces',
  'normals',
  'skinWeights',
  'uvs',
  'vertices'
]
const INT_ATTR_KEYS = [
  'skinIndices'
]

const fetchFloatBuffers = createBufferFetcher(Float32Array)
const fetchIntBuffers = createBufferFetcher(Uint16Array)

export function loadModel (baseUrl, modelJson) {
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
  ]).then((resolutions) => resolutions.reduce((hash, data) => {
    hash[data.key] = data.buffer
    return hash
  }, {}))
}

function createBufferFetcher (BufferCtor) {
  return ({key, url}) => new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => resolve({
        key,
        buffer: new BufferCtor(buffer)
      }))
  })
}

function formatDestPath (baseUrl, key, ext) {
  return `${baseUrl}/${key}.${ext}`
}
