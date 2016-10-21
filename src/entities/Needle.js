import {
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Vector3
} from 'three'

import { inherit } from '../utils/ctor'
import { Entity } from '../mixins/Entity'

export function Needle () {
  this.item = this.createItem()
  this.position = new Vector3()
  this.normal = new Vector3()
  this.offset = 0
}

inherit(null, Needle, Entity, {
  createItem () {
    return this.createDebugLine()
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
