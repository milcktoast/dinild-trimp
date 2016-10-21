import {
  Vector3
} from 'three'

const scratchVec3 = new Vector3()

export function pointOnLine (ray, origin, direction, out) {
  const d1 = ray.direction
  const d2 = direction

  const a = d1.dot(d1)
  const b = d1.dot(d2)
  const e = d2.dot(d2)

  const d = a * e - b * b
  if (d === 0) return

  const r = scratchVec3.subVectors(ray.origin, origin)
  const c = d1.dot(r)
  const f = d2.dot(r)
  const t = (a * f - b * c) / d
  return out.copy(direction)
    .multiplyScalar(t)
    .add(origin)
}
