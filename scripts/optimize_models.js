const fs = require('fs')
const path = require('path')

const ARR = '\x1b[32m>>>\x1b[0m'
const OK = '\x1b[32m... OK\x1b[0m'

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

function writeLn (str) {
  process.stdout.write(str + '\n')
}

function optimizeModel (src) {
  writeLn(ARR + ' Optimize model: ' + path.basename(src))
  const basePath = path.join(process.cwd(), src)
  const data = fs.readFileSync(basePath + '/full.json', 'utf8')
  const json = JSON.parse(data)
  const skinningData = filterSkinningBones(json)

  FLOAT_ATTR_KEYS.forEach((key) => {
    const attrJson = key === 'uvs'
      ? json[key][0]
      : json[key]
    writeFloatData(formatDestPath(basePath, key, 'bin'), attrJson)
  })

  INT_ATTR_KEYS.forEach((key) => {
    const attrJson = json[key]
    const mappedJson = attrJson && key === 'skinIndices'
      ? mapSkinIndices(attrJson, skinningData)
      : attrJson
    writeIntData(formatDestPath(basePath, key, 'bin'), mappedJson)
  })

  writeBoneData(formatDestPath(basePath, 'bones', 'json'), json, skinningData)
  writeAnimationData(formatDestPath(basePath, 'boneFrames', 'json'), json, skinningData)
  writeMetaData(formatDestPath(basePath, 'meta', 'json'), json, skinningData)
  writeLn(OK + '\n')
}

function filterSkinningBones (data) {
  const { bones } = data
  if (!bones) return {}
  const indexMap = {'-1': -1}
  const skinBones = bones
    .filter((bone) => bone.name.indexOf('control') !== 0)
  skinBones.forEach((bone, index) => {
    const prevIndex = bones.indexOf(bone)
    indexMap[prevIndex] = index
  })
  skinBones.forEach((bone) => {
    bone.parent = indexMap[bone.parent]
  })
  return {
    bones: skinBones,
    indexMap
  }
}

function mapSkinIndices (data, skin) {
  const { indexMap } = skin
  return data.map((v) => indexMap[v] || 0)
}

function formatDestPath (basePath, key, ext) {
  return `${basePath}/${key}.${ext}`
}

function writeFloatData (destPath, data) {
  if (!data) return
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
  if (!data) return
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

function writeBoneData (destPath, data, skin) {
  const { bones } = skin
  if (!bones) return
  fs.writeFileSync(destPath, JSON.stringify(bones), {
    encoding: 'utf8'
  })
}

// TODO: Write animation data to float binary file
function writeAnimationData (destPath, data, skin) {
  const { animations } = data
  const { indexMap } = skin
  if (!animations) return
  const boneFrames = animations[0].hierarchy
    .filter((boneFrame, index) => indexMap[index] != null)
    .map((boneFrame) => boneFrame.keys.map(({pos, rot, scl}) => ({
      pos, rot, scl
    })))
  fs.writeFileSync(destPath, JSON.stringify(boneFrames), {
    encoding: 'utf8'
  })
}

function writeMetaData (destPath, json, skin) {
  const metaData = {
    uvs: json.metadata.uvs,
    normals: json.metadata.normals,
    vertices: json.metadata.vertices,
    faces: json.metadata.faces
  }
  if (skin.bones) {
    metaData.bones = skin.bones.length
  }
  if (json.animations) {
    metaData.animationFrames = json.animations[0].hierarchy[0].keys.length
  }
  if (json.skinIndices) {
    metaData.skinIndices = json.skinIndices.length / 4
    metaData.skinWeights = json.skinWeights.length / 4
    metaData.skinInfluencesPerVertex = json.influencesPerVertex
  }
  fs.writeFileSync(destPath, JSON.stringify(metaData), {
    encoding: 'utf8'
  })
}

optimizeModel('./assets/models/dinild')
optimizeModel('./assets/models/needle')
