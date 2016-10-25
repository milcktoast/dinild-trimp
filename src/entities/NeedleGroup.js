import {
  BufferGeometry,
  BufferAttribute,
  Matrix3,
  Mesh,
  MeshPhongMaterial
} from 'three'

import { inherit } from '../utils/ctor'
import { Entity } from '../mixins/Entity'

export function NeedleGroup () {
  this.instanceCount = 0
  this.maxInstances = 50
  this.verticesPerInstance = 36
  this.normalMatrix = new Matrix3()
  this.material = this.createMaterial()
  this.item = this.createItem()
}

inherit(null, NeedleGroup, Entity, {
  createMaterial () {
    return new MeshPhongMaterial({
      color: 0xffffff,
      // skinning: true,
      transparent: true
    })
  },

  createItem () {
    const { material, maxInstances, verticesPerInstance } = this
    const vertsCount = maxInstances * verticesPerInstance
    const geometry = new BufferGeometry()
    const position = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    const normal = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    const uv = new BufferAttribute(new Float32Array(vertsCount * 2), 2)
    geometry.addAttribute('position', position)
    geometry.addAttribute('normal', normal)
    geometry.addAttribute('uv', uv)
    return new Mesh(geometry, material)
  },

  addInstanceFrom (entity) {
    const instanceCount = this.instanceCount++
    const itemFrom = entity.item
    const { item, verticesPerInstance } = this

    const positionMatrix = itemFrom.matrixWorld
    const normalMatrix = this.normalMatrix.getNormalMatrix(itemFrom.matrixWorld)

    const positionFrom = itemFrom.geometry.getAttribute('position')
    const positionItem = item.geometry.getAttribute('position')
    const normalFrom = itemFrom.geometry.getAttribute('normal')
    const normalItem = item.geometry.getAttribute('normal')
    const uvFrom = itemFrom.geometry.getAttribute('uv')
    const uvItem = item.geometry.getAttribute('uv')

    for (let i = 0; i < verticesPerInstance; i++) {
      const offset = instanceCount * verticesPerInstance + i
      positionItem.copyAt(offset, positionFrom, i)
      normalItem.copyAt(offset, normalFrom, i)
      uvItem.copyAt(offset, uvFrom, i)
    }

    positionMatrix.applyToBuffer(positionItem,
      instanceCount * verticesPerInstance, verticesPerInstance)
    normalMatrix.applyToBuffer(normalItem,
      instanceCount * verticesPerInstance, verticesPerInstance)

    item.geometry.drawRange.count = (instanceCount + 1) * verticesPerInstance
    positionItem.needsUpdate = true
    normalItem.needsUpdate = true
    uvItem.needsUpdate = true
  }
})
