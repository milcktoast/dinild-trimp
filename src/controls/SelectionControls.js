import {
  EventDispatcher,
  Raycaster,
  Vector2
  // Vector3
} from 'three'
import { inherit } from '../utils/ctor'

// const scratchVec3 = new Vector3()

export function SelectionControls (object, domElement) {
  this.object = object
  this.domElement = domElement || document

  this.optionPositions = null
  this.valueIndex = -1

  this.target = {
    pointerTarget: null
  }
  this.context = {
    pointer: new Vector2(),
    raycaster: new Raycaster()
  }
  this.size = {
    width: 0,
    height: 0
  }

  this._addEvent = { type: 'add' }
  this.domElement.addEventListener('mousedown', this.mouseDown.bind(this), false)
}

inherit(EventDispatcher, SelectionControls, {
  resize (event) {
    const { size } = this
    size.width = window.innerWidth
    size.height = window.innerHeight
  },

  mouseDown (event) {
    const { context, object, size } = this
    const { pointer, raycaster } = context
    pointer.x = (event.clientX / size.width) * 2 - 1
    pointer.y = -(event.clientY / size.height) * 2 + 1
    raycaster.setFromCamera(pointer, object)
    this.pointerSelect(event, context)
  },

  pointerSelect (event, context) {
    const { pointerTarget } = this.target
    const { raycaster } = context
    if (!pointerTarget) return

    const intersects = raycaster.intersectObject(pointerTarget)
    if (!intersects.length) return
    const { point } = intersects[0]

    const prevIndex = this.valueIndex
    const nextIndex = this.findSelectionAt(point)

    event.preventDefault()
    this.valueIndex = nextIndex
    if (prevIndex !== nextIndex) {
      this.dispatchEvent(this._addEvent)
    }
  },

  findSelectionAt (position) {
    const positions = this.optionPositions
    const { x, y, z } = position
    let distance = Infinity
    let index = -1
    for (let i = 0; i < positions.length; i += 3) {
      const dx = x - positions[i]
      const dy = y - positions[i + 1]
      const dz = z - positions[i + 2]
      const dist = dx * dx + dy * dy + dz * dz
      if (dist < distance) {
        distance = dist
        index = i / 3
      }
    }
    return index
  }
})
