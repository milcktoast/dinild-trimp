import {
  BufferGeometry,
  BufferAttribute,
  Matrix3,
  MeshPhongMaterial,
  SkinnedMesh
} from 'three'

import { inherit } from '../utils/ctor'
import { copyVectorToAttribute } from '../utils/vector'
import { Entity } from '../mixins/Entity'

export function NeedleGroup (params) {
  this.instanceCount = 0
  this.maxInstances = 50
  this.verticesPerInstance = 36
  this.normalMatrix = new Matrix3()
  this.castShadow = params.castShadow
  this.receiveShadow = params.receiveShadow
  this.material = this.createMaterial()
}

inherit(null, NeedleGroup, Entity, {
  createMaterial () {
    return new MeshPhongMaterial({
      color: 0xffffff,
      skinning: true,
      transparent: true
    })
  },

  createGeometry () {
    const { maxInstances, verticesPerInstance } = this
    const vertsCount = maxInstances * verticesPerInstance

    const geometry = new BufferGeometry()
    const position = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    const normal = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    const uv = new BufferAttribute(new Float32Array(vertsCount * 2), 2)
    const skinIndex = new BufferAttribute(new Float32Array(vertsCount * 4), 4)
    const skinWeight = new BufferAttribute(new Float32Array(vertsCount * 4), 4)

    geometry.addAttribute('position', position)
    geometry.addAttribute('normal', normal)
    geometry.addAttribute('uv', uv)
    geometry.addAttribute('skinIndex', skinIndex)
    geometry.addAttribute('skinWeight', skinWeight)

    return geometry
  },

  createItem () {
    return Promise.resolve().then(() => {
      const { castShadow, material, receiveShadow } = this
      const geometry = this.createGeometry()
      const item = new SkinnedMesh(geometry, material)

      Object.assign(item, {
        castShadow,
        receiveShadow
      })

      this.item = item
      return this
    })
  },

  addInstanceFrom (entity) {
    const instanceCount = this.instanceCount++
    const itemFrom = entity.item
    const { skinIndex, skinWeight } = entity
    const { item, verticesPerInstance } = this

    const positionMatrix = itemFrom.matrixWorld
    const normalMatrix = this.normalMatrix.getNormalMatrix(itemFrom.matrixWorld)

    const geomFrom = itemFrom.geometry
    const geomItem = item.geometry

    const positionFrom = geomFrom.getAttribute('position')
    const positionItem = geomItem.getAttribute('position')
    const normalFrom = geomFrom.getAttribute('normal')
    const normalItem = geomItem.getAttribute('normal')
    const uvFrom = geomFrom.getAttribute('uv')
    const uvItem = geomItem.getAttribute('uv')
    const skinIndexItem = geomItem.getAttribute('skinIndex')
    const skinWeightItem = geomItem.getAttribute('skinWeight')

    for (let i = 0; i < verticesPerInstance; i++) {
      const offset = instanceCount * verticesPerInstance + i
      positionItem.copyAt(offset, positionFrom, i)
      normalItem.copyAt(offset, normalFrom, i)
      uvItem.copyAt(offset, uvFrom, i)
      copyVectorToAttribute(skinIndex, skinIndexItem, offset)
      copyVectorToAttribute(skinWeight, skinWeightItem, offset)
    }

    positionMatrix.applyToBuffer(positionItem,
      instanceCount * verticesPerInstance, verticesPerInstance)
    normalMatrix.applyToBuffer(normalItem,
      instanceCount * verticesPerInstance, verticesPerInstance)

    geomItem.drawRange.count = (instanceCount + 1) * verticesPerInstance
    positionItem.needsUpdate = true
    normalItem.needsUpdate = true
    uvItem.needsUpdate = true
    skinIndexItem.needsUpdate = true
    skinWeightItem.needsUpdate = true
  }
})
