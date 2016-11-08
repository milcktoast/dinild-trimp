import {
  Color
} from 'three'

import { MOUTH_FRAMES_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'
import { createVector, copyVector } from '../utils/vector'
import { SceneState } from '../state/SceneState'

// TODO: Create plain object
function createColor (...args) {
  return new Color(...args)
}

export function IndexSceneState (context) {
  this.context = context
  this.state = this.createState()
}

inherit(SceneState, IndexSceneState, {
  createState () {
    const { defaults } = this
    return {
      camera: defaults.camera(),
      fog: defaults.fog(),
      skinBasic: defaults.skinBasic(),
      skin: defaults.skin(),
      pose: defaults.pose(),
      lightTop: defaults.lightTop(),
      lightBottom: defaults.lightBottom(),
      lightAmbient: defaults.lightAmbient()
    }
  },

  defaults: {
    camera () {
      const cameraOptions = [{
        position: createVector(6, 3, 23),
        target: createVector(2, 4, 5),
        up: createVector(0, 1, 0),
        fov: 92
      }, {
        position: createVector(-4.5, 2.5, 22.5),
        target: createVector(3, 0, 1),
        up: createVector(0, 1, 0),
        fov: 92
      }, {
        position: createVector(-4, 3.5, 25.5),
        target: createVector(2, 0, 1),
        up: createVector(0, 1, 0),
        fov: 80.5
      }]
      const cameraStart = cameraOptions[0]

      return {
        position: createVector(cameraStart.position),
        target: createVector(cameraStart.target),
        up: createVector(cameraStart.up),
        fov: cameraStart.fov,
        reset: () => {
          const { state } = this
          copyVector(state.camera.position, cameraStart.position)
          copyVector(state.camera.target, cameraStart.target)
          copyVector(state.camera.up, cameraStart.up)
          state.camera.fov = cameraStart.fov
          this.syncState()
        }
      }
    },

    fog () {
      return {
        color: createColor(0x11001D),
        near: 11.2,
        far: 15.6
      }
    },

    skinBasic () {
      return {
        color: createColor(0xffffff),
        roughness: 0.35,
        metalness: 0,
        normalScale: 1,
        lightIntensity: 1.0
      }
    },

    skin () {
      return {
        color: createColor(0xffffff),
        roughness: 0.19,
        metalness: 0,
        normalScale: 1,
        textureAnisotropy: 4,
        lightIntensity: 20 // FIXME
      }
    },

    pose () {
      return {
        frames: MOUTH_FRAMES_MAP,
        startFrame: 0,
        targetFrame: 1,
        activeFrameWeight: 0
      }
    },

    lightTop () {
      return {
        position: createVector(-13, 21.5, 20.5),
        target: createVector(4.5, -1.5, 5),
        color: createColor(0xCAFF7C),
        intensity: 2.7,
        distance: 35,
        angle: 0.62,
        penumbra: 0.2,
        decay: 0.9,
        castShadow: true
      }
    },

    lightBottom () {
      return {
        position: createVector(2, -30, 33),
        target: createVector(-6, 5.5, 1),
        color: createColor(0xD1F08A),
        intensity: 2.4,
        distance: 80,
        angle: 0.59,
        penumbra: 0.2,
        decay: 0.75,
        castShadow: true
      }
    },

    lightAmbient () {
      return {
        skyColor: createColor(0xA7D9F0),
        groundColor: createColor(0x413550),
        intensity: 1.2
      }
    }
  },

  syncState () {
    this.updateState(this.state)
  },

  getSkinState (nextState) {
    const { dinild } = this.context.entities
    return dinild && dinild.material.type === 'SkinMaterial'
      ? nextState.skin
      : nextState.skinBasic
  },

  updateState (nextState) {
    this.updateCamera(nextState.camera)
    this.updateFog(nextState.fog)
    this.updateLights(nextState)
    this.updateDinild(nextState)
  },

  updateLights (nextState) {
    const { lights } = this.context
    const skinState = this.getSkinState(nextState)
    if (!lights.top) return
    this.updateSpotLight(lights.top, nextState.lightTop, skinState.lightIntensity)
    this.updateSpotLight(lights.bottom, nextState.lightBottom, skinState.lightIntensity)
    this.updateHemiLight(lights.ambient, nextState.lightAmbient)
  },

  updateDinild (nextState) {
    const { dinild } = this.context.entities
    if (!dinild) return
    const skinState = this.getSkinState(nextState)
    this.updatePose(dinild.pose, dinild.item, nextState.pose)
    this.updateSkinMaterial(dinild.material, skinState)
  }
})
