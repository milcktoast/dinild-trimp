import {
  EventDispatcher,
  Raycaster,
  Vector2
} from 'three'
import { inherit } from '../utils/ctor'

export function SelectionControls (object, domElement) {
  this.object = object
  this.domElement = domElement || document

  this.optionUVs = null
  this.intersections = []
  this.target = {
    pointerTarget: null
  }

  this.size = new Vector2()
  this.raycaster = new Raycaster()
  this.context = {
    start: this.createEventContext(),
    end: this.createEventContext()
  }

  this._addEvent = { type: 'add' }
  this.domElement.addEventListener('mousedown', this.mouseDown.bind(this), false)
  this.domElement.addEventListener('mouseup', this.mouseUp.bind(this), false)
}

inherit(EventDispatcher, SelectionControls, {
  createEventContext () {
    return {
      time: null,
      intersections: null,
      pointer: new Vector2()
    }
  },

  resize (event) {
    const { size } = this
    size.x = window.innerWidth
    size.y = window.innerHeight
  },

  updateContext (event, name) {
    const { context, object, raycaster, size, target } = this
    const { pointerTarget } = target
    if (!pointerTarget) return

    const currentContext = context[name]
    const { pointer } = currentContext
    pointer.x = (event.clientX / size.x) * 2 - 1
    pointer.y = -(event.clientY / size.y) * 2 + 1

    raycaster.setFromCamera(pointer, object)
    currentContext.intersections = raycaster.intersectObject(pointerTarget)
    currentContext.time = Date.now()

    return context
  },

  mouseDown (event) {
    this.updateContext(event, 'start')
  },

  mouseUp (event) {
    const { start, end } = this.updateContext(event, 'end')
    const duration = end.time - start.time
    const screenDist = end.pointer.distanceTo(start.pointer)
    if (screenDist < 0.02 && duration > 50) {
      this.pointerSelect(event, end)
    }
  },

  pointerSelect (event, context) {
    const { intersections } = context
    if (!intersections.length) return

    const { face, point, uv } = intersections[0]
    const valueIndex = this.findSelectionAt(uv)
    this.intersections.push({
      valueIndex, face, point, uv
    })
    this.dispatchEvent(this._addEvent)
    event.preventDefault()
  },

  findSelectionAt (uv) {
    const uvs = this.optionUVs
    const { x, y } = uv
    let distance = Infinity
    let index = -1
    for (let i = 0; i < uvs.length; i += 2) {
      const dx = x - uvs[i]
      const dy = y - uvs[i + 1]
      const dist = dx * dx + dy * dy
      if (dist < distance) {
        distance = dist
        index = i / 2
      }
    }
    return index
  }
})
