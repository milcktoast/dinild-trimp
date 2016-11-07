import {
  MeshStandardMaterial
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { inherit } from '../utils/ctor'
import { memoizeAll } from '../utils/function'
import { loadAudioSprite } from '../utils/audio-load'
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
const WORDS_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/audio_sprite/words.json'), 'utf8'))

export function Dinild (params) {
  this.castShadow = params.castShadow
  this.receiveShadow = params.receiveShadow
  this.useSubsurface = params.useSubsurface
  this.textureQuality = params.textureQuality
}

Object.assign(Dinild, memoizeAll({
  preload () {
    return Promise.all([
      Dinild.loadModel(),
      Dinild.loadSkin()
    ])
  },

  load (textureQuality) {
    return Promise.all([
      Dinild.loadModel(),
      Dinild.loadSkin(),
      Dinild.loadTextures(textureQuality)
    ]).then(([model, skin, textures]) => ({
      model, skin, textures
    }))
  },

  loadModel () {
    return loadModel(MODEL_ASSET_PATH, MODEL_META)
      .then((modelData) => parseModel(modelData, MODEL_META))
  },

  loadSkin () {
    return loadSkin(MODEL_ASSET_PATH, MODEL_META)
      .then((skinData) => parseSkin(skinData, MODEL_META))
  },

  loadTextures (quality) {
    return Promise.all([
      loadTexture(`${TEXTURE_ASSET_PATH}/diffuse_${quality}`),
      loadTexture(`${TEXTURE_ASSET_PATH}/normal_${quality}`)
    ]).then(([diffuse, normal]) => ({
      diffuse, normal
    }))
  },

  loadAudio () {
    return loadAudioSprite(WORDS_META)
  }
}))

inherit(null, Dinild, Entity, {
  createMaterial (textures) {
    const MaterialCtor = this.useSubsurface
      ? SkinMaterial
      : MeshStandardMaterial
    const material = new MaterialCtor({
      map: textures.diffuse,
      normalMap: textures.normal,
      skinning: true
    })
    if (material.render) {
      this.renderSkin = material.render.bind(material)
    }
    return material
  },

  createItem () {
    return Dinild.load(this.textureQuality).then(({ model, skin, textures }) => {
      const { geometry } = model
      const { frames, skeleton } = skin
      const material = this.createMaterial(textures)
      const item = new SkinnedMesh(geometry, material)
      const pose = new PoseAnimation(frames)
      const phrase = new PhraseAnimation()

      Object.assign(item, {
        castShadow: this.castShadow,
        receiveShadow: this.receiveShadow
      })

      // TODO: Optimize pointer target geometry
      Object.assign(this, {
        item,
        material,
        phrase,
        pointerTarget: item,
        pose,
        skeleton
      })

      item.add(skeleton)
      item.bind(skeleton)
      this.createAudio()

      return this
    })
  },

  createAudio () {
    Dinild.loadAudio().then((words) => {
      this.words = words
      this.phrase.addEventListener('wordStart', this.onPhraseWordStart.bind(this))
      this.phrase.addEventListener('wordEnd', this.onPhraseWordEnd.bind(this))
    })
  },

  onPhraseWordStart (event) {
    const { word } = event
    if (word.name === 'spacer') return
    console.log('word start', word.name)
    this.words.play(word.name)
  },

  onPhraseWordEnd (event) {
    // const { word } = event
    // if (word.name === 'spacer') return
    // console.log('word end', word.name)
    // this.words.stop(word.name)
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
