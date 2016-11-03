import {
  PerspectiveCamera
} from 'three'

import { inherit } from '../utils/ctor'
import { SelectionControls } from '../controls/SelectionControls'

export function IndexCamera (container) {
  PerspectiveCamera.call(this, 1, 1, 0.1, 100)
  this.controls = new SelectionControls(this)
}

inherit(PerspectiveCamera, IndexCamera, {
  inject (container) {
    this.controls.bindElement(container)
    return Promise.resolve()
  },

  update () {
    this.controls.update()
  },

  resize () {
    this.aspect = window.innerWidth / window.innerHeight
    this.updateProjectionMatrix()
    this.controls.resize()
  }
})
