import {
  ShaderChunk,
  ShaderMaterial
} from 'three'

export function extendShaderMaterial (Ctor, proto = {}) {
  Ctor.prototype = Object.create(ShaderMaterial.prototype)
  Ctor.prototype.constructor = Ctor
  Ctor.prototype.isShaderMaterial = true
  Object.assign(Ctor.prototype, proto)
}

export function createUniforms (uniforms) {
  const wrapped = {}
  Object.keys(uniforms).forEach((key) => {
    wrapped[key] = { value: uniforms[key] }
  })
  return wrapped
}

export function injectShaderChunk (name, source) {
  if (ShaderChunk[name] !== undefined) return
  ShaderChunk[name] = source
}
