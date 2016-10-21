import {
  Vector3
} from 'three'

const scratchVec3 = new Vector3()

export function applyToBuffer (matrix, buffer, offset_, count_) {
  const offset = offset_ || 0
  const count = count_ || buffer.count
  for (let i = 0, j = offset; i < count; i++, j++) {
    scratchVec3.x = buffer.getX(j)
    scratchVec3.y = buffer.getY(j)
    scratchVec3.z = buffer.getZ(j)
    scratchVec3.applyMatrix4(matrix)
    buffer.setXYZ(j, scratchVec3.x, scratchVec3.y, scratchVec3.z)
  }
  return buffer
}
