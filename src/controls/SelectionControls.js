import {
  EventDispatcher,
  Raycaster,
  Vector2,
  Vector3
} from 'three'
import { inherit } from '../utils/ctor'
import { bindAll } from '../utils/function'
import { clamp } from '../utils/math'
import { pointOnLine } from '../utils/ray'
import { factorTween, factorTweenAll, KEYS } from '../utils/tween'

const scratchVec3A = new Vector3()
const scratchVec3B = new Vector3()

export function SelectionControls (camera, element) {
  this.camera = camera
  this.bindElement(element)

  this.cursorEntity = null
  this.targetEntity = null
  this.targetOptionUVs = null

  this.size = new Vector2()
  this.raycaster = new Raycaster()
  this.context = {
    move: this.createEventContext(),
    start: this.createEventContext(),
    drag: this.createEventContext(),
    end: this.createEventContext()
  }

  this.isPointerDown = false
  this.isPointerDragging = false
  this.cursorState = {
    position: new Vector3(),
    normal: new Vector3(),
    offset: 2,
    opacity: 0
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
      intersection: null,
      screen: new Vector2(),
      point: new Vector3()
    }
  },

  resize (event) {
    const { size } = this
    size.x = window.innerWidth
    size.y = window.innerHeight
  },

  updateContext (event, name) {
    const { camera, context, raycaster, size, targetEntity } = this
    const pointerTarget = targetEntity && targetEntity.pointerTarget // FIXME
    const currentContext = context[name]

    const { screen } = currentContext
    screen.x = (event.clientX / size.x) * 2 - 1
    screen.y = -(event.clientY / size.y) * 2 + 1
    raycaster.setFromCamera(screen, camera)

    if (name === 'drag') {
      const { start } = context
      const { face, point } = start.intersection
      pointOnLine(raycaster.ray, point, face.normal, currentContext.point)
    } else if (pointerTarget) {
      const intersections = raycaster.intersectObject(pointerTarget)
      currentContext.intersection = intersections[0]
    }

    return context
  },

  mouseDown (event) {
    const { start } = this.updateContext(event, 'start')
    const { intersection } = start
    const eventStart = this._events.start

    this.isPointerDown = true
    if (intersection) {
      this.isPointerDragging = true
      this.offsetCursor(0.1)
      this.orientCursor(intersection)
      this.dispatchEvent(eventStart)
    }
  },

  mouseMove (event) {
    const { isPointerDown, isPointerDragging } = this

    if (isPointerDown && isPointerDragging) {
      const { start, drag } = this.updateContext(event, 'drag')
      this.dragCursorOffset(event, start, drag)
      event.preventDefault()
    } else if (!isPointerDown) {
      const { move } = this.updateContext(event, 'move')
      const { intersection } = move
      if (intersection) {
        this.showCursor()
        this.orientCursor(intersection)
      } else {
        this.hideCursor()
      }
    }
  },

  dragCursorOffset (event, start, drag) {
    const A = start.intersection.point
    const B = start.intersection.face.normal
    const P = drag.point

    const ABU = scratchVec3A.subVectors(B, A).normalize()
    const AP = scratchVec3B.subVectors(A, P)

    const t = clamp(-2, 2,
      ABU.x * AP.x + ABU.y * AP.y + ABU.z * AP.z)
    this.offsetCursor(t)
  },

  mouseUp (event) {
    const { cursorState, isPointerDragging } = this
    const eventEnd = this._events.end

    if (isPointerDragging && cursorState.offset < 0) {
      const { start, end } = this.updateContext(event, 'end')
      const { face, point } = end.intersection
      this.resetCursor(point, face.normal, 2)
      this.pointerSelect(start)
    } else {
      this.offsetCursor(2)
    }

    if (isPointerDragging) {
      this.dispatchEvent(eventEnd)
      event.preventDefault()
    }

    this.isPointerDown = false
    this.isPointerDragging = false
  },

  pointerSelect (context) {
    const { intersection } = context
    const { face, point, uv } = intersection
    const eventAdd = this._events.add

    eventAdd.face = face
    eventAdd.point = point
    eventAdd.uv = uv
    eventAdd.value = this.findSelectionAt(uv)
    this.dispatchEvent(eventAdd)
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

  offsetCursor (offset) {
    const { cursorState } = this
    cursorState.offset = offset
  },

  orientCursor (intersection) {
    const { cursorState } = this
    const { face, point } = intersection
    const { normal } = face

    cursorState.position.copy(point)
    cursorState.normal.copy(normal)
  },

  resetCursor (position, normal, offset) {
    const { cursorEntity, cursorState } = this

    cursorEntity.position.copy(normal)
      .multiplyScalar(10)
      .add(position)

    cursorState.position.copy(position)
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
    scratchVec3A
      .copy(cursorEntity.normal)
      .multiplyScalar(cursorEntity.offset)
    cursorEntity.item.position
      .copy(cursorEntity.position)
      .add(scratchVec3A)

    // rotation
    scratchVec3A
      .copy(cursorEntity.normal)
      .multiplyScalar(10)
      .add(cursorEntity.position)
    cursorEntity.item
      .lookAt(scratchVec3A)
  },

  update (frame) {
    this.updateCursor()
  }
})
