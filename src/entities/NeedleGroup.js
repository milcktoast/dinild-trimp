import {
  Group
} from 'three'

import { inherit } from '../utils/ctor'

export function NeedleGroup () {
  this.item = new Group()
}

inherit(null, NeedleGroup, {
  add (child) {
    this.item.add(child)
  },

  addTo (parent) {
    this.parent = parent
    parent.add(this.item)
  }
})
