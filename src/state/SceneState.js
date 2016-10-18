import {
  SkeletonHelper,
  SpotLightHelper
} from 'three'

import { RENDER_SETTINGS } from '../constants/fidelity'
import { inherit } from '../utils/ctor'

export function SceneState (context) {
  this.context = context
}

inherit(null, SceneState, {
  updateCamera (state) {
    const { camera } = this.context
    camera.position.copy(state.position)
    camera.up.copy(state.up).normalize()
    camera.fov = state.fov
    camera.controls.target.copy(state.target)
    camera.updateProjectionMatrix()
  },

  updateFog (state) {
    const { renderer, scene } = this.context
    renderer.setClearColor(state.color)
    scene.fog.color.copy(state.color)
    scene.fog.near = state.near
    scene.fog.far = state.far
  },

  updatePose (pose, mesh, state) {
    if (!pose) return
    pose.resetWeights()
    pose.weights[state.startFrame] += 1 - state.activeFrameWeight
    pose.weights[state.targetFrame] += state.activeFrameWeight
    pose.applyWeights(mesh.skeleton.bones)
    if (state.helper && !mesh.skeletonHelper) this.addSkeletonHelper(mesh)
    if (mesh.skeletonHelper) mesh.skeletonHelper.visible = !!state.helper
  },

  updateSkinMaterial (material, state) {
    if (!material) return
    const { map, normalMap } = material
    material.shininess = state.shininess
    material.normalScale.set(state.normalScale, state.normalScale)
    if (map.anisotropy !== state.textureAnisotropy) {
      map.anisotropy = state.textureAnisotropy
      normalMap.anisotropy = state.textureAnisotropy
      if (map.image) map.needsUpdate = true
      if (normalMap.image) normalMap.needsUpdate = true
    }
  },

  updateLight (light, state) {
    light.color.copy(state.color)
    light.position.copy(state.position)
    light.intensity = state.intensity
    light.castShadow = RENDER_SETTINGS.castShadows && state.castShadow
  },

  updateSpotLight (light, state) {
    this.updateLight(light, state)
    light.target.position.copy(state.target)
    light.target.updateMatrixWorld()
    light.distance = state.distance
    light.angle = state.angle
    light.penumbra = state.penumbra
    light.decay = state.decay
    if (state.helper && !light.helper) this.addSpotlightHelper(light)
    if (light.helper) light.helper.visible = !!state.helper
  },

  updateHemiLight (light, state) {
    light.color.copy(state.skyColor)
    light.groundColor.copy(state.groundColor)
    light.intensity = state.intensity
  },

  addSkeletonHelper (mesh) {
    const { scene, tasks } = this.context
    const helper = new SkeletonHelper(mesh)
    mesh.skeletonHelper = helper
    scene.helpers.add(helper)
    tasks.add(helper, 'update')
  },

  addSpotlightHelper (light) {
    const { scene, tasks } = this.context
    const helper = new SpotLightHelper(light)
    light.helper = helper
    scene.helpers.add(helper)
    tasks.add(helper, 'update')
  }
})
