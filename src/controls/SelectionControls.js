import {
  EventDispatcher,
  Raycaster,
  Spherical,
  Vector2,
  Vector3
} from 'three'

import { inherit } from '../utils/ctor'
import { clamp, lerp } from '../utils/math'
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
    add: { type: 'add' }
  },

  _documentEvents: [
    'mouseDown', 'mouseMove', 'mouseUp'
  ],

  bindElement (element) {
    this.element = element
    this._documentEvents.forEach((name) => {
      document.addEventListener(name.toLowerCase(), this[name].bind(this), false)
    })
    this.resize()
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
      orientation: new Spherical(20),
      target: new Vector3()
    }
  },

  resize () {
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

  // Mouse

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
      const { screen } = move
      this.orientCamera(screen)
      this.targetCamera(screen)
    }
  },

  mouseUp (event) {
    const { cursorStateTarget, isPointerDragging } = this
    const eventEnd = this._events.end

    this.isPointerDown = false
    this.isPointerDragging = false

    if (isPointerDragging && cursorStateTarget.offset < -1) {
      const { start, end } = this.updateContext(event, 'end')
      const { face, point } = end.intersection
      this.dispatchCursorSelection(start)
      this.resetCursor(point, face.normal, 2)
    } else {
      this.offsetCursor(2)
    }

    if (isPointerDragging) {
      this.dispatchEvent(eventEnd)
      event.preventDefault()
    }
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

    const phiDir = Math.sin(orientation.phi)
    const phi = phiDir * easeQuadraticOut(Math.abs(orientation.phi))
    const y = Math.sin(phi) * orientation.radius

    camera.position.x = target.x + x
    camera.position.y = target.y + y
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

  orientCursor (intersection) {
    const { cursorStateTarget } = this
    const { face, point } = intersection
    const { normal } = face

    cursorStateTarget.position.copy(point)
    cursorStateTarget.normal.copy(normal)
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

    cursorStateTarget.position.copy(position)
    cursorStateTarget.normal.copy(normal)
    cursorStateTarget.offset = offset
  },

  showCursor () {
    const { element, cursorStateTarget } = this
    cursorStateTarget.opacity = 1
    if (!cursorStateTarget.visible) {
      cursorStateTarget.visible = true
      element.style.cursor = 'crosshair'
    }
  },

  hideCursor () {
    const { element, cursorStateTarget } = this
    cursorStateTarget.opacity = 0
    if (cursorStateTarget.visible) {
      cursorStateTarget.visible = false
      element.style.cursor = ''
    }
  },

  moveCursor () {
    const { isPointerDown } = this
    if (isPointerDown) return

    const { move } = this.refreshContext('move')
    const { intersection } = move
    if (intersection) {
      this.showCursor()
      this.orientCursor(intersection)
    } else {
      this.hideCursor()
    }
  },

  updateCursor () {
    const { cursorEntity, cursorStateTarget } = this
    if (!cursorEntity) return

    factorTween('opacity', cursorEntity.material, cursorStateTarget, 0.1)
    factorTween('offset', cursorEntity, cursorStateTarget, 0.15)
    factorTweenAll(KEYS.Vector3, 'position', cursorEntity, cursorStateTarget, 0.4)
    factorTweenAll(KEYS.Vector3, 'normal', cursorEntity, cursorStateTarget, 0.1)

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
