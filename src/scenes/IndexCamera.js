import {
  PerspectiveCamera
} from 'three'

import { inherit } from '../utils/ctor'
import { SelectionControls } from '../controls/SelectionControls'

export function IndexCamera (container) {
  PerspectiveCamera.call(this, 1, 1, 0.1, 100)
  const controls = new SelectionControls(this, container)

  Object.assign(this, {
    controls
  })
}

inherit(PerspectiveCamera, IndexCamera)
