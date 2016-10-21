import {
  EventDispatcher,
  Raycaster,
  Vector2,
  Vector3
} from 'three'
import { inherit } from '../utils/ctor'
import { bindAll } from '../utils/function'
import { factorTween, factorTweenAll, KEYS } from '../utils/tween'

const scratchVec3 = new Vector3()

export function SelectionControls (camera, element) {
  this.camera = camera
  this.bindElement(element)

  this.optionUVs = null
  this.intersections = []

  this.previewEntity = null
  this.targetEntity = null

  this.size = new Vector2()
  this.raycaster = new Raycaster()
  this.context = {
    start: this.createEventContext(),
    move: this.createEventContext(),
    end: this.createEventContext()
  }

  this.isPointerDown = false

  this.previewState = {
    opacity: 0,
    offset: 0,
    position: new Vector3(),
    normal: new Vector3()
  }
}

inherit(EventDispatcher, SelectionControls, {
  _events: {
    start: { type: 'start' },
    end: { type: 'end' },
    add: { type: 'add' }
  },

  _elementEvents: [
    'mouseDown', 'mouseMove', 'mouseUp'
  ],

  bindElement (element_) {
    const element = element_ || document
    this.element = element
    bindAll(this, ...this._elementEvents)
    this._elementEvents.forEach((name) => {
      element.addEventListener(name.toLowerCase(), this[name], false)
    })
  },

  createEventContext () {
    return {
      frame: null,
      intersections: [],
      pointer: new Vector2()
    }
  },

  resize (event) {
    const { size } = this
    size.x = window.innerWidth
    size.y = window.innerHeight
  },

  updateContext (event, name) {
    const { camera, context, raycaster, size, targetEntity } = this
    const pointerTarget = targetEntity && targetEntity.pointerTarget
    const currentContext = context[name]

    const { pointer } = currentContext
    pointer.x = (event.clientX / size.x) * 2 - 1
    pointer.y = -(event.clientY / size.y) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    if (pointerTarget) {
      currentContext.intersections = raycaster.intersectObject(pointerTarget)
    }

    return context
  },

  mouseDown (event) {
    const { start } = this.updateContext(event, 'start')
    const intersection = start.intersections[0]
    if (intersection) {
      this.isPointerDown = true
      this.orientPreview(intersection, -1)
      this.dispatchEvent(this._events.start)
    }
  },

  mouseMove (event) {
    const { move } = this.updateContext(event, 'move')
    const intersection = move.intersections[0]
    if (intersection) {
      this.showPreview()
      if (!this.isPointerDown) {
        this.orientPreview(intersection, 1)
      }
    } else {
      this.hidePreview()
    }
  },

  mouseUp (event) {
    const { start, end } = this.updateContext(event, 'end')
    const duration = end.time - start.time
    const screenDist = end.pointer.distanceTo(start.pointer)
    if (screenDist < 0.02 && duration > 50) {
      this.pointerSelect(event, end)
    }
    this.isPointerDown = false
    this.dispatchEvent(this._events.end)
  },

  pointerSelect (event, context) {
    const { intersections } = context
    if (!intersections.length) return

    const { face, point, uv } = intersections[0]
    const valueIndex = this.findSelectionAt(uv)
    this.intersections.push({
      valueIndex, face, point, uv
    })
    this.dispatchEvent(this._events.add)
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
  },

  orientPreview (intersection, offset) {
    const { previewState } = this
    const { face, point } = intersection
    const { normal } = face

    previewState.position.copy(point)
    previewState.normal.copy(normal)
    previewState.offset = offset
  },

  showPreview () {
    const { previewState } = this
    previewState.opacity = 1
  },

  hidePreview () {
    const { previewState } = this
    previewState.opacity = 0
  },

  updatePreview () {
    const { previewEntity, previewState } = this

    factorTween('opacity', previewEntity.item.material, previewState, 0.1)
    factorTween('offset', previewEntity, previewState, 0.15)
    factorTweenAll(KEYS.position, previewEntity.position, previewState.position, 0.4)
    factorTweenAll(KEYS.position, previewEntity.normal, previewState.normal, 0.4)

    // position, offset
    scratchVec3
      .copy(previewEntity.normal)
      .multiplyScalar(previewEntity.offset)
    previewEntity.item.position
      .copy(previewEntity.position)
      .add(scratchVec3)

    // rotation
    scratchVec3
      .copy(previewEntity.normal)
      .multiplyScalar(10)
      .add(previewEntity.position)
    previewEntity.item
      .lookAt(scratchVec3)
  },

  update (frame) {
    this.updatePreview()
  }
})
