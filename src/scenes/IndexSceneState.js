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
    const cameraOptions = [{
      position: createVector(6, 3, 23),
      target: createVector(3, 0, 1),
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
      camera: {
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
      },
      fog: {
        color: createColor(0x11001D),
        near: 11.2,
        far: 15.6
      },
      skin: {
        shininess: 30,
        normalScale: 1,
        textureAnisotropy: 4
      },
      pose: {
        frames: MOUTH_FRAMES_MAP,
        startFrame: 0,
        targetFrame: 1,
        activeFrameWeight: 0
      },
      lightTop: {
        position: createVector(-13, 21.5, 20.5),
        target: createVector(4.5, -1.5, 5),
        color: createColor(0xCAFF7C),
        intensity: 2.3,
        distance: 35,
        angle: 0.62,
        penumbra: 0.2,
        decay: 0.9,
        castShadow: true
      },
      lightBottom: {
        position: createVector(2, -14, 24.5),
        target: createVector(0, 5.5, 1),
        color: createColor(0xD1F08A),
        intensity: 2.4,
        distance: 40,
        angle: 0.59,
        penumbra: 0.2,
        decay: 0.75,
        castShadow: true
      },
      lightAmbient: {
        skyColor: createColor(0xBCADFF),
        groundColor: createColor(0xDBFFF4),
        intensity: 0.6
      }
    }
  },

  syncState () {
    this.updateState(this.state)
  },

  updateState (nextState) {
    this.updateCamera(nextState.camera)
    this.updateFog(nextState.fog)
    this.updateLights(nextState)
    this.updateDinild(nextState)
  },

  updateLights (nextState) {
    const { lights } = this.context
    if (!lights.top) return
    this.updateSpotLight(lights.top, nextState.lightTop)
    this.updateSpotLight(lights.bottom, nextState.lightBottom)
    this.updateHemiLight(lights.ambient, nextState.lightAmbient)
  },

  updateDinild (nextState) {
    const { dinild } = this.context.entities
    if (!dinild) return
    this.updatePose(dinild.pose, dinild.item, nextState.pose)
    this.updateSkinMaterial(dinild.material, nextState.skin)
  }
})
