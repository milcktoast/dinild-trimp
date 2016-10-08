import fetch from 'isomorphic-fetch'

const FLOAT_ATTR_KEYS = [
  'faces',
  'normals',
  'uvs',
  'vertices'
]

export function loadModel (baseUrl, modelJson) {
  return Promise.all(
    FLOAT_ATTR_KEYS
      .filter((key) => !!modelJson[key])
      .map((key) => new Promise((resolve, reject) => {
        fetchBuffer(formatDestPath(baseUrl, key, 'bin'))
          .then((buffer) => resolve({key, buffer}))
      }))
  ).then((resolutions) => resolutions.reduce((hash, data) => {
    hash[data.key] = data.buffer
    return hash
  }, {}))
}

function formatDestPath (baseUrl, key, ext) {
  return `${baseUrl}/${key}.${ext}`
}

function fetchBuffer (url) {
  return fetch(url)
    .then((res) => res.arrayBuffer())
    .then((buffer) => new Float32Array(buffer))
}
