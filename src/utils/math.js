// Linear mapping from range <a1, a2> to range <b1, b2>
export function mapLinear (a1, a2, b1, b2, x) {
  return b1 + (x - a1) * (b2 - b1) / (a2 - a1)
}
