import {
  Group,
  MeshPhongMaterial,
  SkinnedMesh
} from 'three'

import { RENDER_SETTINGS } from '../constants/fidelity'
import { inherit } from '../utils/ctor'
import { loadModel, loadTexture } from '../utils/model-load'
import { parseModel } from '../utils/model-parse'
import { PoseAnimation } from '../animations/PoseAnimation'
import { SkinMaterial } from '../materials/SkinMaterial'

const MODEL_META = require('../../assets/models/dinild/meta.json')

export function Dinild () {
  this.item = new Group()
  this.material = this.createSkinMaterial()
  this.loadModel()
}

inherit(null, Dinild, {
  addTo (parent) {
    parent.add(this.item)
  },

  createSkinMaterial () {
    const basePath = '../assets/textures/dinild'
    const MaterialCtor = RENDER_SETTINGS.skinSubsurface
      ? SkinMaterial
      : MeshPhongMaterial
    const material = new MaterialCtor({
      map: loadTexture(basePath + '/diffuse'),
      normalMap: loadTexture(basePath + '/normal'),
      // roughness: 0.25
      skinning: true
    })
    if (material.render) {
      this.renderSkin = material.render.bind(material)
    }
    return material
  },

  loadModel () {
    const { material } = this
    loadModel('../assets/models/dinild', MODEL_META).then((modelData) => {
      const { geometry } = parseModel(modelData, MODEL_META)
      const mesh = new SkinnedMesh(geometry, material)
      const pose = new PoseAnimation(geometry.boneFrames)
      Object.assign(mesh, {
        castShadow: RENDER_SETTINGS.castShadows,
        receiveShadow: RENDER_SETTINGS.castShadows
      })
      Object.assign(this, {
        mesh, pose
      })
      this.item.add(mesh)
    })
  },

  renderSkin () {},

  render (renderer, scene, camera) {
    this.renderSkin(renderer, scene, camera)
  }
})
