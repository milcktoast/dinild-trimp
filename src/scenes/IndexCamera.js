import {
  PerspectiveCamera
} from 'three'

import { inherit } from '../utils/ctor'
import { TrackballControls } from '../controls/TrackballControls'
import { SelectionControls } from '../controls/SelectionControls'

export function IndexCamera (container) {
  PerspectiveCamera.call(this, 1, 1, 0.1, 100)
  const controls = new TrackballControls(this, container)
  const selection = new SelectionControls(this, container)

  Object.assign(this, {
    controls,
    selection
  })
  Object.assign(controls, {
    rotateSpeed: 1,
    zoomSpeed: 0.8,
    panSpeed: 0.1,
    noZoom: false,
    noPan: false,
    dynamicDampingFactor: 0.3,
    minDistance: 18,
    maxDistance: 30
  })

  selection.addEventListener('start', () => {
    controls.enabled = false
  })
  selection.addEventListener('end', () => {
    controls.enabled = true
  })
}

inherit(PerspectiveCamera, IndexCamera)
