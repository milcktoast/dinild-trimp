import {
  Color,
  ShaderMaterial,
  UniformsUtils
} from 'three'
import { extendShaderMaterial } from '../utils/material'
import { CrystalShader } from '../shaders/CrystalShader'

export function CrystalMaterial (params = {}) {
  ShaderMaterial.call(this)

  // TODO: Set color from scene state
  this.color = new Color(0.4, 0.0, 1.0)
  this.time = 0

  this.setValues({
    fragmentShader: CrystalShader.fragmentShader,
    vertexShader: CrystalShader.vertexShader,
    uniforms: UniformsUtils.clone(CrystalShader.uniforms),
    fog: true,
    ...params
  })
  this.refreshUniforms()
}

extendShaderMaterial(CrystalMaterial, {
  _uniformKeys: [
    'color',
    'opacity',
    'time'
  ],

  refreshUniforms () {
    this._uniformKeys.forEach((key) => {
      this.uniforms[key].value = this[key]
    })
  },

  render (renderer, scene, camera) {
    this.time += 0.01
    this.refreshUniforms()
  }
})
