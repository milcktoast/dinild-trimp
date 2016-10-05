/**
 * @author alteredq / http://alteredqualia.com/
 */

import {
  LinearFilter,
  RGBAFormat,
  WebGLRenderTarget
} from 'three'
import { CopyShader } from '../shaders/CopyShader'
import { ClearMaskPass, MaskPass } from './MaskPass'
import { ShaderPass } from './ShaderPass'

export function EffectComposer (renderer, renderTarget) {
  this.renderer = renderer

  if (renderTarget === undefined) {
    var parameters = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      stencilBuffer: false
    }
    var size = renderer.getSize()
    renderTarget = new WebGLRenderTarget(size.width, size.height, parameters)
  }

  this.renderTarget1 = renderTarget
  this.renderTarget2 = renderTarget.clone()

  this.writeBuffer = this.renderTarget1
  this.readBuffer = this.renderTarget2

  this.passes = []

  if (CopyShader === undefined) {
    console.error('EffectComposer relies on CopyShader')
  }

  this.copyPass = new ShaderPass(CopyShader)
};

Object.assign(EffectComposer.prototype, {

  swapBuffers () {
    var tmp = this.readBuffer
    this.readBuffer = this.writeBuffer
    this.writeBuffer = tmp
  },

  addPass (pass) {
    this.passes.push(pass)

    var size = this.renderer.getSize()
    pass.setSize(size.width, size.height)
  },

  insertPass (pass, index) {
    this.passes.splice(index, 0, pass)
  },

  render (delta) {
    var maskActive = false
    var pass

    for (var i = 0, il = this.passes.length; i < il; i++) {
      pass = this.passes[ i ]

      if (pass.enabled === false) continue

      pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive)

      if (pass.needsSwap) {
        if (maskActive) {
          var context = this.renderer.context

          context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff)

          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta)

          context.stencilFunc(context.EQUAL, 1, 0xffffffff)
        }

        this.swapBuffers()
      }

      if (MaskPass !== undefined) {
        if (pass instanceof MaskPass) {
          maskActive = true
        } else if (pass instanceof ClearMaskPass) {
          maskActive = false
        }
      }
    }
  },

  reset (renderTarget) {
    if (renderTarget === undefined) {
      var size = this.renderer.getSize()

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

    for (var i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(width, height)
    }
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
