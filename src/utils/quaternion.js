export function add (a, b) {
  a._x += b._x
  a._y += b._y
  a._z += b._z
  a._w += b._w

  a.onChangeCallback()
  return a
}

export function sub (a, b) {
  a._x -= b._x
  a._y -= b._y
  a._z -= b._z
  a._w -= b._w

  a.onChangeCallback()
  return a
}

export function multiplyScalar (a, scalar) {
  a._x *= scalar
  a._y *= scalar
  a._z *= scalar
  a._w *= scalar

  a.onChangeCallback()
  return a
}

export function nlerp (a, b, alpha) {
  a._x += (b.x - a._x) * alpha
  a._y += (b.y - a._y) * alpha
  a._z += (b.z - a._z) * alpha
  a._w += (b.w - a._w) * alpha

  a.onChangeCallback()
  return a
}
