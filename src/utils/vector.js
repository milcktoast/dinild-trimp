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
