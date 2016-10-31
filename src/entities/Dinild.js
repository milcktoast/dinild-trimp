import {
  MeshPhongMaterial
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { inherit } from '../utils/ctor'
import { loadModel, loadSkin, loadTexture } from '../utils/model-load'
import { parseModel, parseSkin } from '../utils/model-parse'
import { easeQuadraticInOut } from '../utils/tween'
import { Entity } from '../mixins/Entity'
import { PoseAnimation } from '../animations/PoseAnimation'
import { PhraseAnimation } from '../animations/PhraseAnimation'
import { SkinnedMesh } from '../objects/SkinnedMesh'
import { SkinMaterial } from '../materials/SkinMaterial'

const MODEL_ASSET_PATH = './assets/models/dinild'
const TEXTURE_ASSET_PATH = './assets/textures/dinild'
const MODEL_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/models/dinild/meta.json'), 'utf8'))

export function Dinild (params) {
  this.castShadow = params.castShadow
  this.receiveShadow = params.receiveShadow
  this.useSubsurface = params.useSubsurface
  this.textureQuality = params.textureQuality
  this.material = this.createMaterial()
}

Object.assign(Dinild, {
  load () {
    if (!Dinild._load) {
      Dinild._load = Promise.all([
        Dinild.loadModel(),
        Dinild.loadSkin()
      ])
    }
    return Dinild._load
  },

  loadModel () {
    return loadModel(MODEL_ASSET_PATH, MODEL_META)
      .then((modelData) => parseModel(modelData, MODEL_META))
  },

  loadSkin () {
    return loadSkin(MODEL_ASSET_PATH, MODEL_META)
      .then((skinData) => parseSkin(skinData, MODEL_META))
  }
})

inherit(null, Dinild, Entity, {
  createMaterial () {
    const { useSubsurface, textureQuality } = this
    const MaterialCtor = useSubsurface
      ? SkinMaterial
      : MeshPhongMaterial
    const material = new MaterialCtor({
      map: loadTexture(`${TEXTURE_ASSET_PATH}/diffuse_${textureQuality}`),
      normalMap: loadTexture(`${TEXTURE_ASSET_PATH}/normal_${textureQuality}`),
      // roughness: 0.25
      skinning: true
    })
    if (material.render) {
      this.renderSkin = material.render.bind(material)
    }
    return material
  },

  createItem () {
    return Dinild.load().then(([model, skin]) => {
      const { castShadow, material, receiveShadow } = this
      const { geometry } = model
      const { frames, skeleton } = skin
      const item = new SkinnedMesh(geometry, material)
      const pose = new PoseAnimation(frames)
      const phrase = new PhraseAnimation()

      Object.assign(item, {
        castShadow,
        receiveShadow
      })

      // TODO: Optimize pointer target geometry
      Object.assign(this, {
        item,
        phrase,
        pointerTarget: item,
        pose,
        skeleton
      })

      item.add(skeleton)
      item.bind(skeleton)

      return this
    })
  },

  update () {
    const { phrase } = this
    if (!phrase) return
    phrase.update()
  },

  updateBones () {
    const { phrase, pose, skeleton } = this
    pose.resetWeights()
    phrase.applyToWeights(pose.weights, easeQuadraticInOut)
    pose.applyWeights(skeleton.bones)
  },

  renderSkin () {},

  render (renderer, scene, camera) {
    this.updateBones()
    this.renderSkin(renderer, scene, camera)
  }
})
