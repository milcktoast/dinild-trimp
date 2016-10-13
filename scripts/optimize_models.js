const fs = require('fs')
const path = require('path')

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
  INT_ATTR_KEYS.forEach((key) => {
    const attrJson = json[key]
    writeIntData(formatDestPath(basePath, key, 'bin'), attrJson)
  })
  writeBoneData(formatDestPath(basePath, 'bones', 'json'), json)
  writeAnimationData(formatDestPath(basePath, 'boneFrames', 'json'), json)
  writeMetaData(formatDestPath(basePath, 'meta', 'json'), json)
  console.log('Optimized model: ' + path.basename(src))
}

function formatDestPath (basePath, key, ext) {
  return `${basePath}/${key}.${ext}`
}

function writeFloatData (destPath, data) {
  const writer = fs.createWriteStream(destPath)
  const floatBuffer = new Float32Array(data)
  const elementBytes = Float32Array.BYTES_PER_ELEMENT
  const buffer = new Buffer(floatBuffer.length * elementBytes)
  for (let i = 0; i < floatBuffer.length; i++) {
    buffer.writeFloatLE(floatBuffer[i], i * elementBytes)
  }
  writer.write(buffer)
  writer.end()
}

function writeIntData (destPath, data) {
  const writer = fs.createWriteStream(destPath)
  const intBuffer = new Uint16Array(data)
  const elementBytes = Uint16Array.BYTES_PER_ELEMENT
  const buffer = new Buffer(intBuffer.length * elementBytes)
  for (let i = 0; i < intBuffer.length; i++) {
    buffer.writeInt16LE(intBuffer[i], i * elementBytes)
  }
  writer.write(buffer)
  writer.end()
}

function writeBoneData (destPath, data) {
  fs.writeFileSync(destPath, JSON.stringify(data.bones), {
    encoding: 'utf8'
  })
}

// TODO: Write animation data to float binary file
function writeAnimationData (destPath, data) {
  const { animations } = data
  const boneFrames = animations[0].hierarchy
    .map((boneFrame) => boneFrame.keys.map(({pos, rot, scl}) => ({
      pos, rot, scl
    })))
  fs.writeFileSync(destPath, JSON.stringify(boneFrames), {
    encoding: 'utf8'
  })
}

function writeMetaData (destPath, json) {
  const metaData = {
    uvs: json.metadata.uvs,
    normals: json.metadata.normals,
    vertices: json.metadata.vertices,
    faces: json.metadata.faces,
    bones: json.metadata.bones,
    boneFrames: json.animations[0].hierarchy.length,
    animationFrames: json.animations[0].hierarchy[0].keys.length,
    skinIndices: json.skinIndices.length / 4,
    skinWeights: json.skinWeights.length / 4,
    skinInfluencesPerVertex: json.influencesPerVertex
  }
  fs.writeFileSync(destPath, JSON.stringify(metaData), {
    encoding: 'utf8'
  })
}

optimizeModel('./assets/models/dinild')
