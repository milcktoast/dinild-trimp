const fs = require('fs')
const path = require('path')

const FLOAT_ATTR_KEYS = [
  'faces',
  'normals',
  'uvs',
  'vertices'
]

function optimizeModel (src) {
  const basePath = path.join(process.cwd(), src)
  const data = fs.readFileSync(basePath + '/full.json', 'utf8')
  const json = JSON.parse(data)
  FLOAT_ATTR_KEYS.forEach((key) => {
    const attrJson = key === 'uvs'
      ? json[key][0]
      : json[key]
    writeFloatData(formatDestPath(basePath, key, 'bin'), attrJson)
  })
  writeMetaData(formatDestPath(basePath, 'meta', 'json'), json.metadata)
  console.log('Optimized model: ' + src)
}

function formatDestPath (basePath, key, ext) {
  return `${basePath}/${key}.${ext}`
}

function writeFloatData (destPath, data) {
  const writer = fs.createWriteStream(destPath)
  const floatBuffer = new Float32Array(data)
  const buffer = new Buffer(floatBuffer.length * 4)
  for (let i = 0; i < floatBuffer.length; i++) {
    buffer.writeFloatLE(floatBuffer[i], i * 4)
  }
  writer.write(buffer)
  writer.end()
}

function writeMetaData (destPath, json) {
  fs.writeFileSync(destPath, JSON.stringify(json), {
    encoding: 'utf8'
  })
}

optimizeModel('./assets/models/dinild')
