import {
  Group,
  MeshPhongMaterial,
  SkinnedMesh
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { RENDER_SETTINGS } from '../constants/fidelity'
import { MOUTH_FRAMES } from '../constants/animation'

import { inherit } from '../utils/ctor'
// import { clamp } from '../utils/math'
import { loadModel, loadTexture } from '../utils/model-load'
import { parseModel } from '../utils/model-parse'
import { PoseAnimation } from '../animations/PoseAnimation'
import { SkinMaterial } from '../materials/SkinMaterial'

function expandFrameKeys (map) {
  const expanded = {}
  Object.keys(map).forEach((key) => {
    key.split('').forEach((char) => {
      expanded[char] = map[key]
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

const MODEL_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/models/dinild/meta.json'), 'utf8'))
const PHRASE = {
  frame: 0,
  framesPerLetter: 12,
  letters: mapWordToFrames('__YOU_HAVE_A_MOUF__', expandFrameKeys(MOUTH_FRAMES))
}

export function Dinild () {
  this.item = new Group()
  this.material = this.createSkinMaterial()
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

  load () {
    const { material } = this
    return loadModel('../assets/models/dinild', MODEL_META).then((modelData) => {
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
    this.pose.applyWeights(this.mesh.skeleton.bones)
  },

  renderSkin () {},

  render (renderer, scene, camera) {
    this.updateBones()
    this.renderSkin(renderer, scene, camera)
  }
})
