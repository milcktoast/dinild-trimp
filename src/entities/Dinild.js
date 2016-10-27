import {
  MeshPhongMaterial
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { inherit } from '../utils/ctor'
import { loadModel, loadSkin, loadTexture } from '../utils/model-load'
import { parseModel, parseSkin } from '../utils/model-parse'
import { Entity } from '../mixins/Entity'
import { PoseAnimation } from '../animations/PoseAnimation'
import { SkinnedMesh } from '../objects/SkinnedMesh'
import { SkinMaterial } from '../materials/SkinMaterial'

function easeInOut (k) {
  if ((k *= 2) < 1) return 0.5 * k * k
  return -0.5 * (--k * (k - 2) - 1)
}

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
    return loadModel(MODEL_ASSET_PATH, MODEL_META).then((modelData) => {
      return parseModel(modelData, MODEL_META)
    })
  },

  loadSkin () {
    return loadSkin(MODEL_ASSET_PATH, MODEL_META).then((skinData) => {
      const { skeleton, frames } = parseSkin(skinData, MODEL_META)
      const pose = new PoseAnimation(frames)
      return { pose, skeleton }
    })
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
      const { pose, skeleton } = skin
      const item = new SkinnedMesh(geometry, material)

      Object.assign(item, {
        castShadow,
        receiveShadow
      })

      // TODO: Optimize pointer target geometry
      Object.assign(this, {
        item,
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
    const { pose, phrase } = this
    if (!(pose && phrase)) return
    pose.resetWeights()
    this.updateMouthWeights(pose, phrase)
  },

  // TODO: Fix intermittent glitches - occur when `frame` isn't reset
  updateMouthWeights (pose, phrase) {
    const { weights } = pose
    const { charFrames, framesPerChar } = phrase

    let frame = phrase.frame++
    const end = charFrames.length * framesPerChar
    if (frame > end) {
      if (phrase.loop) frame = phrase.frame = 0
      else return
    }

    const wordProgress = (frame / end) % 1
    const charProgress = (frame % framesPerChar) / framesPerChar
    const charAtIndex = Math.floor(wordProgress * charFrames.length)
    const charToIndex = (charAtIndex + 1) % charFrames.length

    const charAtPoseIndex = charFrames[charAtIndex]
    const charToPoseIndex = charFrames[charToIndex]
    const charProgressEased = easeInOut(charProgress)

    weights[charAtPoseIndex] += 1 - charProgressEased
    weights[charToPoseIndex] += charProgressEased

    // console.log(`${charAtIndex} ${charToIndex} - ${charProgress}`)
    // console.log(charAtPoseIndex, charToPoseIndex)
  },

  updateBones () {
    this.pose.applyWeights(this.skeleton.bones)
  },

  renderSkin () {},

  render (renderer, scene, camera) {
    this.updateBones()
    this.renderSkin(renderer, scene, camera)
  }
})
