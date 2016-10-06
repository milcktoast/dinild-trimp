import { ShaderMaterial } from 'three'

export function extendShaderMaterial (Ctor, proto = {}) {
  Ctor.prototype = Object.create(ShaderMaterial.prototype)
  Ctor.prototype.constructor = Ctor
  Ctor.prototype.isShaderMaterial = true
  Object.assign(Ctor.prototype, proto)
}
