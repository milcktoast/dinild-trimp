import {
  Geometry,
  Group,
  Line,
  LineBasicMaterial,
  Vector3
} from 'three'

import { inherit } from '../utils/ctor'
import { Entity } from '../mixins/Entity'

export function NeedleGroup () {
  this.item = new Group()
}

inherit(null, NeedleGroup, Entity, {
  createDebugLine () {
    const geom = new Geometry()
    const mat = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true
    })
    geom.vertices.push(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 2))
    return new Line(geom, mat)
  },

  createPreviewEntity () {
    return {
      item: this.createDebugLine(),
      position: new Vector3(),
      normal: new Vector3()
    }
  }
})
