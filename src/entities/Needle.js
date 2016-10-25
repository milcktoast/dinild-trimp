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

inherit(null, Needle, Entity, {
  createMaterial () {
    return new MeshPhongMaterial({
      color: 0xffffff,
      // skinning: true,
      transparent: true
    })
  },

  load () {
    return this.loadModel().then((model) => {
      this.item = model.mesh
      return this
    })
  },

  loadModel () {
    const { material } = this
    return loadModel(ASSET_PATH, MODEL_META).then((modelData) => {
      const { geometry } = parseModel(modelData, MODEL_META)
      const mesh = new Mesh(geometry, material)
      mesh.up.set(0, 0, 1)
      return { mesh }
    })
  }
})
