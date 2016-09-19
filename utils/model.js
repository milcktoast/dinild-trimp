import {
  BufferAttribute,
  BufferGeometry
} from 'three'

export function parseModel (props) {
  return {
    geometry: createGeometry(props)
  }
}

function createGeometry (props) {
  const geometry = new BufferGeometry()
  const attributes = parseBufferAttributes(props)
  addBufferAttribute(geometry, {
    key: 'position',
    value: attributes.position,
    type: Float32Array,
    itemSize: 3
  })
  addBufferAttribute(geometry, {
    key: 'normal',
    value: attributes.normal,
    type: Float32Array,
    itemSize: 3
  })
  addBufferAttribute(geometry, {
    key: 'uv',
    value: attributes.uv,
    type: Float32Array,
    itemSize: 2
  })
  return geometry
}

function addBufferAttribute (geometry, props) {
  const { key, value } = props
  if (!(value && value.length)) return
  const Ctor = props.type
  const typedArray = new Ctor(value)

  geometry.addAttribute(key,
    new BufferAttribute(typedArray, props.itemSize))
}

function isBitSet (value, position) {
  return value & (1 << position)
}

// NOTE: Does not support geometry with quads
function parseBufferAttributes (props) {
  const { faces, normals, uvs, vertices } = props

  if (!faces.length) {
    return {
      position: vertices
    }
  }

  const position = []
  const uv = []
  const normal = []

  const fLength = faces.length
  let fOffset = 0

  while (fOffset < fLength) {
    const type = faces[fOffset++]
    const hasMaterial = isBitSet(type, 1)
    const hasFaceVertexUv = isBitSet(type, 3)
    const hasFaceNormal = isBitSet(type, 4)
    const hasFaceVertexNormal = isBitSet(type, 5)

    let vertA = 3 * faces[fOffset++]
    let vertB = 3 * faces[fOffset++]
    let vertC = 3 * faces[fOffset++]

    position.push(
      vertices[vertA],
      vertices[vertA + 1],
      vertices[vertA + 2],

      vertices[vertB],
      vertices[vertB + 1],
      vertices[vertB + 2],

      vertices[vertC],
      vertices[vertC + 1],
      vertices[vertC + 2])

    if (hasMaterial) {
      fOffset++
    }

    if (hasFaceVertexUv) {
      vertA = 2 * faces[fOffset++]
      vertB = 2 * faces[fOffset++]
      vertC = 2 * faces[fOffset++]

      uv.push(
        uvs[vertA],
        uvs[vertA + 1],

        uvs[vertB],
        uvs[vertB + 1],

        uvs[vertC],
        uvs[vertC + 1])
    }

    if (hasFaceNormal) {
      fOffset++
    }

    if (hasFaceVertexNormal) {
      for (let i = 0; i < 3; i++) {
        const normalIndex = faces[fOffset++] * 3
        normal.push(
          normals[normalIndex],
          normals[normalIndex + 1],
          normals[normalIndex + 2])
      }
    }
  }

  return {
    position,
    normal,
    uv
  }
}
