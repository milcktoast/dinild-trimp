/**
 * @author alteredq / http://alteredqualia.com/
 */

import {
  LinearFilter,
  RGBAFormat,
  WebGLRenderTarget
} from 'three'
import { CopyShader } from '../shaders/CopyShader'
import { ShaderPass } from './ShaderPass'

export function EffectComposer (renderer, renderTarget) {
  if (renderTarget === undefined) {
    const size = renderer.getSize()
    renderTarget = new WebGLRenderTarget(size.width, size.height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      stencilBuffer: false
    })
  }

  this.renderer = renderer
  this.renderTarget1 = renderTarget
  this.renderTarget2 = renderTarget.clone()

  this.writeBuffer = this.renderTarget1
  this.readBuffer = this.renderTarget2

  this.passes = []
  this.copyPass = new ShaderPass(CopyShader)
}

Object.assign(EffectComposer.prototype, {
  swapBuffers () {
    const tmp = this.readBuffer
    this.readBuffer = this.writeBuffer
    this.writeBuffer = tmp
  },

  addPass (pass) {
    const size = this.renderer.getSize()
    pass.setSize(size.width, size.height)
    this.passes.push(pass)
  },

  addPasses (...passes) {
    passes.forEach((pass) => this.addPass(pass))
  },

  insertPass (pass, index) {
    this.passes.splice(index, 0, pass)
  },

  getReadTexture () {
    return this.readBuffer.texture
  },

  getWriteTexture () {
    return this.writeBuffer.texture
  },

  render (delta = 0) {
    const { copyPass, passes, renderer, writeBuffer, readBuffer } = this
    let maskActive = false
    let pass

    for (let i = 0, il = passes.length; i < il; i++) {
      pass = passes[i]
      if (pass.enabled === false) continue
      pass.render(renderer, writeBuffer, readBuffer, delta, maskActive)

      if (pass.needsSwap) {
        if (maskActive) {
          const context = renderer.context
          context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff)
          copyPass.render(renderer, writeBuffer, readBuffer, delta)
          context.stencilFunc(context.EQUAL, 1, 0xffffffff)
        }
        this.swapBuffers()
      }

      if (pass.isMaskPass) {
        maskActive = true
      } else if (pass.isClearMaskPass) {
        maskActive = false
      }
    }
  },

  reset (renderTarget) {
    if (renderTarget === undefined) {
      const size = this.renderer.getSize()
      renderTarget = this.renderTarget1.clone()
      renderTarget.setSize(size.width, size.height)
    }

    this.renderTarget1.dispose()
    this.renderTarget2.dispose()
    this.renderTarget1 = renderTarget
    this.renderTarget2 = renderTarget.clone()

    this.writeBuffer = this.renderTarget1
    this.readBuffer = this.renderTarget2
  },

  setSize (width, height) {
    this.renderTarget1.setSize(width, height)
    this.renderTarget2.setSize(width, height)
    this.passes.forEach((pass) => {
      pass.setSize(width, height)
    })
  }
})

export function Pass () {
  // if set to true, the pass is processed by the composer
  this.enabled = true

  // if set to true, the pass indicates to swap read and write buffer after rendering
  this.needsSwap = true

  // if set to true, the pass clears its buffer before rendering
  this.clear = false

  // if set to true, the result of the pass is rendered to screen
  this.renderToScreen = false
};

Object.assign(Pass.prototype, {
  setSize (width, height) {},

  render (renderer, writeBuffer, readBuffer, delta, maskActive) {
    console.error('Pass: .render() must be implemented in derived pass.')
  }
})
