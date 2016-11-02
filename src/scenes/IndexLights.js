import {
  HemisphereLight,
  SpotLight
} from 'three'

import { inherit } from '../utils/ctor'
import { mapLinear } from '../utils/math'

export function IndexLights () {}

inherit(null, IndexLights, {
  populate (scene, camera, settings) {
    this.top = createSpotLight(settings)
    this.bottom = createSpotLight(settings)
    this.ambient = createHemiLight(settings)
    scene.add(this.top, this.bottom, this.ambient)
    return Promise.resolve(this)
  },

  update (frame, state) {
    if (!this.top) return
    this.top.intensity = modulateIntensity(state.lightTop.intensity,
      0.65, frame * 0.0021)
    this.bottom.intensity = modulateIntensity(state.lightBottom.intensity,
      0.75, frame * 0.0022)
    this.ambient.intensity = modulateIntensity(state.lightAmbient.intensity,
      0.85, frame * 0.0020)
  }
})

function createSpotLight ({ shadowMapSize }) {
  const light = new SpotLight()
  if (shadowMapSize) {
    light.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  }
  return light
}

function createHemiLight () {
  return new HemisphereLight()
}

function modulateSinPrime (t) {
  const { sin } = Math
  return sin(
    sin(17 * t) +
    sin(23 * t) +
    sin(41 * t) +
    sin(59 * t) +
    sin(127 * t))
}

function modulateIntensity (intensity, scaleMin, t) {
  const base = 1// Math.min(1, t * t * 200)
  return base * mapLinear(-1, 1,
    intensity * scaleMin, intensity,
    modulateSinPrime(t))
}
