export function createVector (x, y, z) {
  if (y == null) {
    return { x: x.x, y: x.y, z: x.z }
  }
  return { x, y, z }
}

export function copyVector (a, b) {
  a.x = b.x
  a.y = b.y
  a.z = b.z
  return a
}

export function copyVectorToAttribute (vector, attr, attrIndex = 0) {
  const attrOffset = attrIndex * attr.itemSize
  for (let i = 0; i < attr.itemSize; i++) {
    attr.array[attrOffset + i] = vector.getComponent(i)
  }
  return attr
}

export function copyAttributeToVector (vector, attr, attrIndex = 0) {
  const attrOffset = attrIndex * attr.itemSize
  for (let i = 0; i < attr.itemSize; i++) {
    vector.setComponent(i, attr.array[attrOffset + i])
  }
  return attr
}
