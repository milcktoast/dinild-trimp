/**
 * @author alteredq / http://alteredqualia.com/
 */

import {
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  UniformsUtils
} from 'three'
import { CopyShader } from '../shaders/CopyShader'
import { Pass } from './EffectComposer'

export function TexturePass (map, opacity) {
  Pass.call(this)

  var shader = CopyShader

  this.map = map
  this.opacity = (opacity !== undefined) ? opacity : 1.0

  this.uniforms = UniformsUtils.clone(shader.uniforms)

  this.material = new ShaderMaterial({

    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    depthTest: false,
    depthWrite: false

  })

  this.needsSwap = false

  this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  this.scene = new Scene()

  this.quad = new Mesh(new PlaneBufferGeometry(2, 2), null)
  this.scene.add(this.quad)
};

TexturePass.prototype = Object.assign(Object.create(Pass.prototype), {

  constructor: TexturePass,

  render (renderer, writeBuffer, readBuffer, delta, maskActive) {
    var oldAutoClear = renderer.autoClear
    renderer.autoClear = false

    this.quad.material = this.material

    this.uniforms[ 'opacity' ].value = this.opacity
    this.uniforms[ 'tDiffuse' ].value = this.map
    this.material.transparent = (this.opacity < 1.0)

    renderer.render(this.scene, this.camera, this.renderToScreen ? null : readBuffer, this.clear)

    renderer.autoClear = oldAutoClear
  }

})
