import {
  annotateState,
  createStateControls
} from './utils/oui'

function copyVector (a, b) {
  a.x = b.x
  a.y = b.y
  a.z = b.z
  return a
}

export function createDebug ({
  renderer,
  scene,
  camera,
  state,
  updateState
}) {
  const oui = createStateControls({label: 'Settings'})
  annotateState(state)
  oui(state, updateState)
  camera.controls.addEventListener('change', () => {
    copyVector(state.camera.position, camera.position)
    copyVector(state.camera.up, camera.up)
    copyVector(state.camera.target, camera.controls.target)
    oui(state, updateState)
  })
  return oui
}
