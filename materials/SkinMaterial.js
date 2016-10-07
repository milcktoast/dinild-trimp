import {
  Color,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBFormat,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget
} from 'three'
import {
  BeckmannShader,
  SkinShader
} from '../shaders/SkinShader'
import { extendShaderMaterial } from '../utils/material'
import { BloomPass } from '../post-processing/BloomPass'
import { EffectComposer } from '../post-processing/EffectComposer'
import { RenderPass } from '../post-processing/RenderPass'
import { ShaderPass } from '../post-processing/ShaderPass'
import { TexturePass } from '../post-processing/TexturePass'

export function SkinMaterial (params) {
  ShaderMaterial.call(this)

  this.color = new Color(0xffffff)
  this.map = null
  this.normalMap = null
  this.normalScale = 1
  this.roughness = 0.15
  this.specular = new Color(0xffffff)
  this.specularBrightness = 0.75

  this.passID = 1
  this.materialUV = null
  this.renderTargets = null
  this.hasRenderedBeckmann = false
  this.extensions.derivatives = true

  this.setValues({
    fragmentShader: SkinShader.fragmentShader,
    vertexShader: SkinShader.vertexShader,
    uniforms: UniformsUtils.clone(SkinShader.uniforms),
    lights: true,
    fog: true,
    ...params
  })
}

const UNIFORM_KEYS = [
  'color',
  'map',
  'normalMap',
  'normalScale',
  'roughness',
  'specular',
  'specularBrightness',
  'passID'
]

extendShaderMaterial(SkinMaterial, {
  createMaterialUV (params) {
    return new SkinMaterial({
      ...params,
      vertexShader: SkinShader.vertexShaderUV,
      passID: 0,
      fog: false
    })
  },

  createRenderTargets (renderer, scene, camera, params) {
    function createRenderTarget () {
      const { width, height } = params
      return new WebGLRenderTarget(width, height, {
        minFilter: LinearMipmapLinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat,
        stencilBuffer: false
      })
    }

    function createEffectComposer () {
      return new EffectComposer(renderer, createRenderTarget())
    }

    function createBloomPass (...args) {
      const pass = new BloomPass(...args)
      pass.clear = true
      return pass
    }

    const passes = {
      writeTexture: new RenderPass(scene, camera, this.materialUV, new Color(0x575757)),
      bloom1: createBloomPass(1, 15, 2, 512),
      bloom2: createBloomPass(1, 25, 3, 512),
      bloom3: createBloomPass(1, 25, 4, 512),
      beckmann: new ShaderPass(BeckmannShader)
    }

    const renderTargets = {
      beckmann: createEffectComposer(),
      material: createEffectComposer(),
      blur2: createEffectComposer(),
      blur3: createEffectComposer(),
      blur4: createEffectComposer()
    }

    renderTargets.material.addPass(passes.writeTexture)
    passes.readTexture = new TexturePass(renderTargets.material.getReadTexture())

    renderTargets.blur2.addPasses(passes.readTexture, passes.bloom1)
    renderTargets.blur3.addPasses(passes.readTexture, passes.bloom2)
    renderTargets.blur4.addPasses(passes.readTexture, passes.bloom3)
    renderTargets.beckmann.addPasses(passes.beckmann)

    this.uniforms.tBeckmann.value = renderTargets.beckmann.getWriteTexture()
    this.uniforms.tBlur1.value = renderTargets.material.getReadTexture()
    this.uniforms.tBlur2.value = renderTargets.blur2.getReadTexture()
    this.uniforms.tBlur3.value = renderTargets.blur3.getReadTexture()
    this.uniforms.tBlur4.value = renderTargets.blur4.getReadTexture()

    return renderTargets
  },

  refreshUniforms () {
    UNIFORM_KEYS.forEach((key) => {
      this.uniforms[key].value = this[key]
    })
  },

  render (renderer, scene, camera) {
    if (!this.renderTargets) {
      this.materialUV = this.createMaterialUV({
        color: this.color,
        map: this.map,
        normalMap: this.normalMap,
        normalScale: this.normalScale,
        roughness: this.roughness,
        specular: this.specular,
        specularBrightness: this.specularBrightness
      })
      this.renderTargets = this.createRenderTargets(renderer, scene, camera, {
        width: 512,
        height: 512
      })
    }
    // TODO: Better way to refresh uniforms?
    this.refreshUniforms()
    this.materialUV.refreshUniforms()
    if (!this.hasRenderedBeckmann) {
      this.renderTargets.beckmann.render()
      this.hasRenderedBeckmann = true
    }
    this.renderTargets.material.render()
    this.renderTargets.blur2.render()
    this.renderTargets.blur3.render()
    this.renderTargets.blur4.render()
  }
})
