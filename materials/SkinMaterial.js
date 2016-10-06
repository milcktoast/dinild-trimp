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
  ShaderMaterial.call(this, {
    fragmentShader: SkinShader.fragmentShader,
    vertexShader: SkinShader.vertexShader,
    uniforms: createSkinUniforms(1, params),
    lights: true,
    fog: true
  })
  this.materialUV = this.createMaterialUV(params)
  this.renderTargets = null
  this.hasRenderedBeckmann = false
  this.extensions.derivatives = true
}

extendShaderMaterial(SkinMaterial, {
  createMaterialUV (params) {
    return new SkinMaterialUV(params)
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

  render (renderer, scene, camera) {
    if (!this.renderTargets) {
      this.renderTargets = this.createRenderTargets(renderer, scene, camera, {
        width: 512,
        height: 512
      })
    }
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

function SkinMaterialUV (params) {
  ShaderMaterial.call(this, {
    fragmentShader: SkinShader.fragmentShader,
    vertexShader: SkinShader.vertexShaderUV,
    uniforms: createSkinUniforms(0, params),
    lights: true
  })
  this.extensions.derivatives = true
}

extendShaderMaterial(SkinMaterialUV)

function createSkinUniforms (passID, {
  diffuse = 0xffffff,
  map,
  normalMap,
  normalScale = 1,
  roughness = 0.45,
  specular = 0xffffff,
  specularBrightness = 0.7
}) {
  const uniforms = UniformsUtils.clone(SkinShader.uniforms)
  uniforms.passID.value = passID
  uniforms.diffuse.value.setHex(diffuse)
  uniforms.tDiffuse.value = map
  uniforms.tNormal.value = normalMap
  uniforms.uNormalScale.value = normalScale
  uniforms.uRoughness.value = roughness
  uniforms.specular.value.setHex(specular)
  uniforms.uSpecularBrightness.value = specularBrightness
  return uniforms
}
