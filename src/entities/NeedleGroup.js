import {
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Vector3
} from 'three'

import { inherit } from '../utils/ctor'
import { applyToBuffer } from '../utils/matrix'
import { Entity } from '../mixins/Entity'

export function NeedleGroup () {
  this.instanceCount = 0
  this.maxInstances = 50
  this.verticesPerInstance = 2
  this.item = this.createItem()
}

inherit(null, NeedleGroup, Entity, {
  createItem () {
    const { maxInstances, verticesPerInstance } = this
    const vertsCount = maxInstances * verticesPerInstance
    const geom = new BufferGeometry()
    const mat = new LineBasicMaterial({
      color: 0xffffff
    })
    const position = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    geom.addAttribute('position', position)
    return new LineSegments(geom, mat)
  },

  addInstanceFrom (entity) {
    const instanceCount = this.instanceCount++
    const fromItem = entity.item
    const { item, verticesPerInstance } = this

    const fromPosition = fromItem.geometry.getAttribute('position')
    const itemPosition = item.geometry.getAttribute('position')

    for (let i = 0; i < verticesPerInstance; i++) {
      const offset = instanceCount * verticesPerInstance + i
      itemPosition.copyAt(offset, fromPosition, i)
    }

    applyToBuffer(fromItem.matrixWorld,
      itemPosition, instanceCount * verticesPerInstance, verticesPerInstance)
    itemPosition.needsUpdate = true
  },

  createCursorEntity () {
    return {
      item: this.createDebugLine(),
      position: new Vector3(),
      normal: new Vector3()
    }
  },

  createDebugLine () {
    const geom = new BufferGeometry()
    const mat = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true
    })
    const position = new BufferAttribute(
      new Float32Array([
        0, 0, 0,
        0, 0, 3
      ]), 3)
    geom.addAttribute('position', position)
    return new LineSegments(geom, mat)
  }
})
