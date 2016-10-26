import {
  Mesh,
  MeshPhongMaterial,
  Vector3,
  Vector4
} from 'three'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { inherit } from '../utils/ctor'
import { loadModel } from '../utils/model-load'
import { parseModel } from '../utils/model-parse'
import { Entity } from '../mixins/Entity'

const ASSET_PATH = './assets/models/needle'
const MODEL_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/models/needle/meta.json'), 'utf8'))

export function Needle () {
  this.material = this.createMaterial()
  this.position = new Vector3()
  this.normal = new Vector3()
  this.skinIndex = new Vector4()
  this.skinWeight = new Vector4()
  this.offset = 0
}

Object.assign(Needle, {
  load () {
    if (!Needle._load) {
      Needle._load = Needle.loadModel()
    }
    return Needle._load
  },

  loadModel () {
    return loadModel(ASSET_PATH, MODEL_META).then((modelData) => {
      return parseModel(modelData, MODEL_META)
    })
  }
})

inherit(null, Needle, Entity, {
  createMaterial () {
    return new MeshPhongMaterial({
      color: 0xffffff,
      // skinning: true,
      transparent: true
    })
  },

  createItem () {
    return Needle.load().then((model) => {
      const { material } = this
      const { geometry } = model
      const item = new Mesh(geometry, material)
      item.up.set(0, 0, 1)
      this.item = item
      return this
    })
  }
})
