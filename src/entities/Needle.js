import {
  Mesh,
  Vector3,
  Vector4
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { inherit } from '../utils/ctor'
import { memoizeAll } from '../utils/function'
import { loadModel, loadTexture } from '../utils/model-load'
import { parseModel } from '../utils/model-parse'
import { Entity } from '../mixins/Entity'
import { CrystalMaterial } from '../materials/CrystalMaterial'

const MODEL_ASSET_PATH = './assets/models/needle'
const TEXTURE_ASSET_PATH = './assets/textures/needle'
const MODEL_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/models/needle/meta.json'), 'utf8'))

export function Needle (params) {
  this.position = new Vector3()
  this.normal = new Vector3()
  this.skinIndex = new Vector4()
  this.skinWeight = new Vector4()
  this.offset = 0

  this.castShadow = params.castShadow
  this.receiveShadow = params.receiveShadow
  this.textureQuality = params.textureQuality
}

Object.assign(Needle, memoizeAll({
  preload () {
    return Needle.loadModel()
  },

  load (textureQuality) {
    return Promise.all([
      Needle.loadModel(),
      Needle.loadTextures(textureQuality)
    ]).then(([model, textures]) => ({
      model, textures
    }))
  },

  loadModel () {
    return loadModel(MODEL_ASSET_PATH, MODEL_META)
      .then((modelData) => parseModel(modelData, MODEL_META))
  },

  loadTextures (quality) {
    return Promise.all([
      loadTexture(`${TEXTURE_ASSET_PATH}/normal_${quality}`)
    ]).then(([normal]) => ({
      normal
    }))
  }
}))

inherit(null, Needle, Entity, {
  createMaterial (textures) {
    const material = new CrystalMaterial({
      // color: 0xffffff,
      normalMap: textures.normal,
      transparent: true
    })
    this.renderMaterial = material.render.bind(material)
    return material
  },

  createItem () {
    return Needle.load(this.textureQuality).then(({ model, textures }) => {
      const { castShadow, receiveShadow } = this
      const { geometry } = model
      const material = this.createMaterial(textures)
      const item = new Mesh(geometry, material)

      item.up.set(0, 0, 1)
      Object.assign(item, {
        castShadow,
        receiveShadow
      })

      Object.assign(this, {
        item, material
      })

      return this
    })
  },

  renderMaterial () {},

  render (renderer, scene, camera) {
    this.renderMaterial(renderer, scene, camera)
  }
})
