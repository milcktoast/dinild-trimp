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

  this.cursorEntity = null
  this.targetEntity = null
  this.targetOptionUVs = null

  this.size = new Vector2()
  this.raycaster = new Raycaster()
  this.context = {
    start: this.createEventContext(),
    move: this.createEventContext(),
    end: this.createEventContext()
  }

  this.isPointerDown = false

  this.cursorState = {
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
      this.orientCursor(intersection, -1)
      this.dispatchEvent(this._events.start)
    }
  },

  // TODO: Implement cursor depth controls
  mouseMove (event) {
    const { move } = this.updateContext(event, 'move')
    const intersection = move.intersections[0]

    if (intersection) {
      this.showCursor()
      if (!this.isPointerDown) {
        this.orientCursor(intersection, 1)
      }
    } else {
      this.hideCursor()
    }
  },

  mouseUp (event) {
    const { end } = this.updateContext(event, 'end')
    this.isPointerDown = false
    this.pointerSelect(event, end)
    this.dispatchEvent(this._events.end)
  },

  pointerSelect (event, context) {
    const { intersections } = context
    if (!intersections.length) return

    const eventAdd = this._events.add
    const { face, point, uv } = intersections[0]

    eventAdd.face = face
    eventAdd.point = point
    eventAdd.uv = uv
    eventAdd.value = this.findSelectionAt(uv)

    this.dispatchEvent(eventAdd)
    event.preventDefault()
  },

  findSelectionAt (uv) {
    const uvs = this.targetOptionUVs
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

  orientCursor (intersection, offset) {
    const { cursorState } = this
    const { face, point } = intersection
    const { normal } = face

    cursorState.position.copy(point)
    cursorState.normal.copy(normal)
    cursorState.offset = offset
  },

  showCursor () {
    const { cursorState } = this
    cursorState.opacity = 1
  },

  hideCursor () {
    const { cursorState } = this
    cursorState.opacity = 0
  },

  updateCursor () {
    const { cursorEntity, cursorState } = this

    factorTween('opacity', cursorEntity.item.material, cursorState, 0.1)
    factorTween('offset', cursorEntity, cursorState, 0.15)
    factorTweenAll(KEYS.Vector3, cursorEntity.position, cursorState.position, 0.4)
    factorTweenAll(KEYS.Vector3, cursorEntity.normal, cursorState.normal, 0.4)

    // position, offset
    scratchVec3
      .copy(cursorEntity.normal)
      .multiplyScalar(cursorEntity.offset)
    cursorEntity.item.position
      .copy(cursorEntity.position)
      .add(scratchVec3)

    // rotation
    scratchVec3
      .copy(cursorEntity.normal)
      .multiplyScalar(10)
      .add(cursorEntity.position)
    cursorEntity.item
      .lookAt(scratchVec3)
  },

  update (frame) {
    this.updateCursor()
  }
})
