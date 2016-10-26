import {
  MeshPhongMaterial
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { MOUTH_FRAMES } from '../constants/animation'
import { inherit } from '../utils/ctor'
import { loadModel, loadSkin, loadTexture } from '../utils/model-load'
import { parseModel, parseSkin } from '../utils/model-parse'
import { Entity } from '../mixins/Entity'
import { PoseAnimation } from '../animations/PoseAnimation'
import { SkinnedMesh } from '../objects/SkinnedMesh'
import { SkinMaterial } from '../materials/SkinMaterial'

function expandFrameKeys (frames) {
  const expanded = {}
  frames.forEach((key, index) => {
    key.split('').forEach((char) => {
      expanded[char] = index
    })
  })
  return expanded
}

function mapWordToFrames (word, frames) {
  return word.split('').map((letter) => frames[letter])
}

function easeInOut (k) {
  if ((k *= 2) < 1) return 0.5 * k * k
  return -0.5 * (--k * (k - 2) - 1)
}

const MODEL_ASSET_PATH = './assets/models/dinild'
const TEXTURE_ASSET_PATH = './assets/textures/dinild'
const MODEL_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/models/dinild/meta.json'), 'utf8'))
const PHRASE = {
  frame: 0,
  framesPerLetter: 12,
  letters: mapWordToFrames('__YOU_HAVE_A_MOUF__', expandFrameKeys(MOUTH_FRAMES))
}

export function Dinild (params) {
  this.castShadow = params.castShadow
  this.receiveShadow = params.receiveShadow
  this.useSubsurface = params.useSubsurface
  this.material = this.createMaterial({
    useSubsurface: params.useSubsurface
  })
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
    const { useSubsurface } = this
    const MaterialCtor = useSubsurface
      ? SkinMaterial
      : MeshPhongMaterial
    const material = new MaterialCtor({
      map: loadTexture(TEXTURE_ASSET_PATH + '/diffuse'),
      normalMap: loadTexture(TEXTURE_ASSET_PATH + '/normal'),
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
    const { pose } = this
    if (!pose) return
    pose.resetWeights()
    this.updateMouthWeights(pose, PHRASE)
  },

  // TODO: Fix intermittent glitches - occur when `frame` isn't reset
  updateMouthWeights (pose, phrase) {
    const { weights } = pose
    const { letters, framesPerLetter } = phrase

    let frame = phrase.frame++
    const end = letters.length * framesPerLetter
    if (frame > end) frame = phrase.frame = 0

    const wordProgress = (frame / end) % 1
    const letterProgress = (frame % framesPerLetter) / framesPerLetter
    const letterAtIndex = Math.floor(wordProgress * letters.length)
    const letterToIndex = (letterAtIndex + 1) % letters.length

    const letterAtPoseIndex = letters[letterAtIndex]
    const letterToPoseIndex = letters[letterToIndex]
    const letterProgressEased = easeInOut(letterProgress)

    weights[letterAtPoseIndex] += 1 - letterProgressEased
    weights[letterToPoseIndex] += letterProgressEased

    // console.log(`${letterAtIndex} ${letterToIndex} - ${letterProgress}`)
    // console.log(letterAtPoseIndex, letterToPoseIndex)
  },

  updateBones () {
    if (!this.mesh) return
    this.pose.applyWeights(this.skeleton.bones)
  },

  renderSkin () {},

  render (renderer, scene, camera) {
    this.updateBones()
    this.renderSkin(renderer, scene, camera)
  }
})
