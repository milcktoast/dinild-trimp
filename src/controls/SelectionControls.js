import {
  EventDispatcher,
  Raycaster,
  Spherical,
  Vector2,
  Vector3
} from 'three'

import { inherit } from '../utils/ctor'
import { throttle } from '../utils/function'
import { clamp, lerp, mapLinear } from '../utils/math'
import { pointOnLine } from '../utils/ray'
import { copyAttributeToVector } from '../utils/vector'
import {
  easeQuadraticOut,
  factorTween,
  factorTweenAll,
  KEYS
} from '../utils/tween'

const scratchVec3A = new Vector3()
const scratchVec3B = new Vector3()

export function SelectionControls (camera) {
  this.camera = camera
  this.enableCursor = true

  this.cursorEntity = null
  this.targetEntity = null
  this.targetOptionUVs = null
  this.targetCenter = new Vector3()

  this.size = new Vector2()
  this.raycaster = new Raycaster()
  this.context = {
    start: this.createEventContext(),
    move: this.createEventContext(),
    drag: this.createEventContext(),
    end: this.createEventContext()
  }

  this.isPointerDown = false
  this.isPointerDragging = false

  this.cursorStateTarget = this.createCursorState()
  this.cameraState = this.createCameraState()
  this.cameraStateTarget = this.createCameraState()
}

inherit(null, SelectionControls, EventDispatcher.prototype, {
  _events: {
    start: { type: 'start' },
    end: { type: 'end' },
    add: { type: 'add' },
    cursorIn: { type: 'cursorIn' },
    cursorOut: { type: 'cursorOut' }
  },

  _elementEvents: [
    'mouseDown', 'mouseMove', 'mouseUp',
    'touchStart', 'touchMove', 'touchEnd',
    'deviceOrientation'
  ],

  _documentEvents: [
    'mouseMove'
  ],

  _windowEvents: [
    'deviceOrientation'
  ],

  bindElement (element) {
    this.element = element
    this.bindEvents(element, this._elementEvents)
    this.bindEvents(document, this._documentEvents)
    this.bindEvents(window, this._windowEvents)
    this.resize()
  },

  bindEvents (target, events) {
    events.forEach((name) => {
      target.addEventListener(name.toLowerCase(),
        throttle(50, false, this[name].bind(this)), false)
    })
  },

  createEventContext () {
    return {
      intersection: null,
      screen: new Vector2(),
      point: new Vector3()
    }
  },

  createCursorState () {
    return {
      position: new Vector3(),
      normal: new Vector3(),
      offset: 2,
      opacity: 0,
      visible: false
    }
  },

  createCameraState () {
    return {
      orientation: new Spherical(50),
      target: new Vector3()
    }
  },

  setDistance (distance) {
    this.cameraStateTarget.orientation.radius = distance
  },

  resize () {
    const { size } = this
    size.x = window.innerWidth
    size.y = window.innerHeight
  },

  updateContext (event, name, screenOnly) {
    const { camera, context, raycaster, size, targetEntity } = this
    const pointerTarget = targetEntity && targetEntity.pointerTarget // FIXME
    const currentContext = context[name]

    const { screen } = currentContext
    screen.x = (event.clientX / size.x) * 2 - 1
    screen.y = -(event.clientY / size.y) * 2 + 1
    if (screenOnly) return context

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

  refreshContext (name) {
    const { camera, context, raycaster, targetEntity } = this
    const pointerTarget = targetEntity && targetEntity.pointerTarget // FIXME
    const currentContext = context[name]
    const { screen } = currentContext

    raycaster.setFromCamera(screen, camera)

    if (pointerTarget) {
      const intersections = raycaster.intersectObject(pointerTarget)
      currentContext.intersection = intersections[0]
    }

    return context
  },

  _faceNames: ['a', 'b', 'c'],

  findClosestFaceIndex (face, point) {
    const { targetEntity } = this
    const { geometry } = targetEntity.pointerTarget
    const positionAttr = geometry.getAttribute('position')

    let dist = Infinity
    let closestIndex = -1
    this._faceNames.forEach((key) => {
      const index = face[key]
      const fPoint = copyAttributeToVector(scratchVec3A, positionAttr, index)
      const fDist = point.distanceToSquared(fPoint)
      if (fDist < dist) {
        dist = fDist
        closestIndex = index
      }
    })

    return closestIndex
  },

  // Pointer

  _pointerEvent: {
    originalEvent: null,
    clientX: null,
    clientY: null
  },

  pointerEvent (event, originalEvent_) {
    const pointerEvent = this._pointerEvent
    pointerEvent.clientX = event.clientX
    pointerEvent.clientY = event.clientY
    pointerEvent.originalEvent = originalEvent_ || event
    return pointerEvent
  },

  pointerDown (event) {
    const { start } = this.updateContext(event, 'start')
    const { intersection } = start
    const eventStart = this._events.start

    this.isPointerDown = true
    if (intersection) {
      this.isPointerDragging = true
      event.originalEvent.preventDefault()
      this.offsetCursor(0.1)
      this.orientCursor(intersection)
      this.dispatchEvent(eventStart)
    }
  },

  pointerMove (event) {
    const { isPointerDown, isPointerDragging } = this

    if (isPointerDown && isPointerDragging) {
      const { start, drag } = this.updateContext(event, 'drag')
      this.dragCursorOffset(event, start, drag)
      event.originalEvent.preventDefault()
    } else if (!isPointerDown) {
      const { move } = this.updateContext(event, 'move', true)
      const { screen } = move
      this.orientCamera(screen)
      this.targetCamera(screen)
    }
  },

  pointerUp (event) {
    const { cursorStateTarget, isPointerDragging } = this
    const eventEnd = this._events.end

    this.isPointerDown = false
    this.isPointerDragging = false

    if (isPointerDragging && cursorStateTarget.offset < -1) {
      const { start, end } = this.updateContext(event, 'end')
      const { face, point } = end.intersection
      this.dispatchCursorSelection(start)
      this.hideCursor(true)
      this.resetCursor(point, face.normal, 2)
    } else {
      this.offsetCursor(2)
    }

    if (isPointerDragging) {
      this.dispatchEvent(eventEnd)
      event.originalEvent.preventDefault()
    }
  },

  // Mouse

  mouseDown (event) {
    const pointerEvent = this.pointerEvent(event)
    this.pointerDown(pointerEvent)
  },

  mouseMove (event) {
    const pointerEvent = this.pointerEvent(event)
    this.pointerMove(pointerEvent)
  },

  mouseUp (event) {
    const pointerEvent = this.pointerEvent(event)
    this.pointerUp(pointerEvent)
  },

  // Touch

  touchStart (event) {
    if (this.touchId != null) return
    const touch = event.changedTouches[0]
    const pointerEvent = this.pointerEvent(touch, event)
    this.touchId = touch.identifier
    this.pointerDown(pointerEvent)
  },

  touchMove (event) {
    const touch = this.findActiveTouch(event)
    if (touch) {
      const pointerEvent = this.pointerEvent(touch, event)
      this.pointerMove(pointerEvent)
    }
  },

  touchEnd (event) {
    const touch = this.findActiveTouch(event)
    if (touch) {
      const pointerEvent = this.pointerEvent(touch, event)
      this.touchId = null
      this.pointerUp(pointerEvent)
    }
  },

  findActiveTouch (event) {
    const { touchId } = this
    const { changedTouches } = event
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i]
      if (touch.identifier === touchId) return touch
    }
  },

  // Device

  // TODO: Fix orientation in landscape
  deviceOrientation (event) {
    const { move } = this.context
    const { screen } = move
    screen.x = mapLinear(-40, 40, -1, 1, event.gamma)
    screen.y = mapLinear(30, -15, -1, 1, event.beta)
    this.orientCamera(screen)
    this.targetCamera(screen)
  },

  // Camera Orientation

  orientCamera (screen) {
    const { orientation } = this.cameraStateTarget
    orientation.phi = screen.y * Math.PI * 0.1 + 0.25
    orientation.theta = screen.x * Math.PI * 0.25
  },

  targetCamera (screen) {
    const { targetCenter } = this
    const { target } = this.cameraStateTarget

    const tx = Math.abs(screen.x)
    const ty = Math.abs(screen.y)

    target.x = lerp(0, targetCenter.x * Math.sign(screen.x), tx)
    target.y = lerp(0, targetCenter.y * Math.sign(screen.y), ty)
    target.z = lerp(0, targetCenter.z, 1 - (tx + ty) / 2)
  },

  updateOrientation () {
    const { isPointerDown } = this
    if (isPointerDown) return

    const { camera, cameraState, cameraStateTarget } = this
    const { orientation, target } = cameraState

    factorTweenAll(KEYS.Spherical, 'orientation', cameraState, cameraStateTarget, 0.1)
    factorTweenAll(KEYS.Vector3, 'target', cameraState, cameraStateTarget, 0.1)

    const thetaDir = Math.sign(orientation.theta)
    const theta = thetaDir * easeQuadraticOut(Math.abs(orientation.theta))
    const x = Math.sin(theta) * orientation.radius
    const z = Math.cos(theta * 0.5) * orientation.radius

    const phiDir = Math.sin(orientation.phi)
    const phi = phiDir * easeQuadraticOut(Math.abs(orientation.phi))
    const y = Math.sin(phi) * orientation.radius

    camera.position.x = target.x + x
    camera.position.y = target.y + y
    camera.position.z = target.z + z
    camera.lookAt(target)
  },

  // Cursor

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

  dispatchCursorSelection (context) {
    const { intersection } = context
    const { face, point, uv } = intersection
    const eventAdd = this._events.add

    eventAdd.face = face
    eventAdd.point = point
    eventAdd.uv = uv
    eventAdd.which = this.findSelectionAt(uv)

    this.skinCursor(face, point)
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
    const { cursorStateTarget } = this
    cursorStateTarget.offset = offset
  },

  orientCursor (intersection, immediate) {
    const { cursorStateTarget } = this
    const { face, point } = intersection
    const { normal } = face

    if (immediate) {
      this.resetCursor(point, normal, 1)
    } else {
      cursorStateTarget.position.copy(point)
      cursorStateTarget.normal.copy(normal)
    }
  },

  skinCursor (face, point) {
    const { cursorEntity, targetEntity } = this
    const { skinIndex, skinWeight } = cursorEntity
    const index = this.findClosestFaceIndex(face, point)

    const geometry = targetEntity.pointerTarget.geometry
    const skinIndexAttr = geometry.getAttribute('skinIndex')
    const skinWeightAttr = geometry.getAttribute('skinWeight')

    copyAttributeToVector(skinIndex, skinIndexAttr, index)
    copyAttributeToVector(skinWeight, skinWeightAttr, index)
  },

  resetCursor (position, normal, offset) {
    const { cursorEntity, cursorStateTarget } = this

    cursorEntity.position.copy(normal)
      .multiplyScalar(10)
      .add(position)
    cursorEntity.offset = -offset * 3

    cursorStateTarget.position.copy(position)
    cursorStateTarget.normal.copy(normal)
    cursorStateTarget.offset = offset
  },

  showCursor () {
    const { element, cursorStateTarget } = this
    cursorStateTarget.opacity = 1
    if (!cursorStateTarget.visible) {
      const { position, normal, offset } = cursorStateTarget
      this.resetCursor(position, normal, offset)
      cursorStateTarget.visible = true
      element.style.cursor = 'crosshair'
    }
  },

  hideCursor (immediate) {
    const { element, cursorEntity, cursorStateTarget } = this
    cursorStateTarget.opacity = 0
    if (immediate && cursorEntity) {
      cursorEntity.material.opacity = 0
    }
    if (cursorStateTarget.visible) {
      cursorStateTarget.visible = false
      element.style.cursor = ''
    }
  },

  moveCursor () {
    const { enableCursor, isPointerDown } = this
    if (isPointerDown) return

    const { move } = this.refreshContext('move')
    const { intersection } = move
    if (intersection && enableCursor) {
      this.showCursor()
      this.orientCursor(intersection)
    } else if (intersection) {
      this.hideCursor(true)
      this.orientCursor(intersection, true)
    } else {
      this.hideCursor()
    }
  },

  dispatchCursorEvents (offsetPrev, offset) {
    const { isPointerDragging } = this
    if (!isPointerDragging) return

    if (offsetPrev > 0 && offset < 0) {
      const cursorIn = this._events.cursorIn
      cursorIn.offset = offset
      this.dispatchEvent(cursorIn)
    } else if (offsetPrev < 0 && offset > 0) {
      const cursorOut = this._events.cursorOut
      cursorOut.offset = offset
      this.dispatchEvent(cursorOut)
    }
  },

  updateCursor () {
    const { cursorEntity, cursorStateTarget } = this
    if (!cursorEntity) return

    const offsetPrev = cursorEntity.offset
    const opacity = factorTween('opacity', cursorEntity.material, cursorStateTarget, 0.1)
    const offset = factorTween('offset', cursorEntity, cursorStateTarget, 0.15)
    factorTweenAll(KEYS.Vector3, 'position', cursorEntity, cursorStateTarget, 0.4)
    factorTweenAll(KEYS.Vector3, 'normal', cursorEntity, cursorStateTarget, 0.1)

    const isVisible = opacity > 0.001
    cursorEntity.item.visible = isVisible
    if (!isVisible) return

    this.dispatchCursorEvents(offsetPrev, offset)

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
    this.updateOrientation()
    this.moveCursor()
    this.updateCursor()
  }
})
