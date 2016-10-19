import {
  Color,
  Fog,
  Group,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SpotLight,
  WebGLRenderer
} from 'three'

import { RENDER_SETTINGS } from './constants/fidelity'
import { MOUTH_FRAMES } from './constants/animation'

import { createTaskManager } from './utils/task'
import { createLoop } from './utils/loop'
import { TrackballControls } from './controls/TrackballControls'
import { mapLinear } from './utils/math'
import { SceneState } from './state/SceneState'
import { Dinild } from './entities/Dinild'

function createVector (x, y, z) {
  if (y == null) {
    return { x: x.x, y: x.y, z: x.z }
  }
  return { x, y, z }
}

function copyVector (a, b) {
  a.x = b.x
  a.y = b.y
  a.z = b.z
  return a
}

function createColor (...args) {
  return new Color(...args)
}

const cameraOptions = [{
  position: createVector(6, 3, 23),
  target: createVector(3, 0, 1),
  up: createVector(0, 1, 0),
  fov: 92
}, {
  position: createVector(-4.5, 2.5, 22.5),
  target: createVector(3, 0, 1),
  up: createVector(0, 1, 0),
  fov: 92
}, {
  position: createVector(-4, 3.5, 25.5),
  target: createVector(2, 0, 1),
  up: createVector(0, 1, 0),
  fov: 80.5
}]
const cameraStart = cameraOptions[0]

const state = {
  camera: {
    position: createVector(cameraStart.position),
    target: createVector(cameraStart.target),
    up: createVector(cameraStart.up),
    fov: cameraStart.fov,
    reset: () => {
      copyVector(state.camera.position, cameraStart.position)
      copyVector(state.camera.target, cameraStart.target)
      copyVector(state.camera.up, cameraStart.up)
      state.camera.fov = cameraStart.fov
      updateState(state)
    }
  },
  fog: {
    color: createColor(0x11001D),
    near: 11.2,
    far: 15.6
  },
  skin: {
    shininess: 30,
    normalScale: 1,
    textureAnisotropy: 4
  },
  pose: {
    frames: MOUTH_FRAMES,
    startFrame: 0,
    targetFrame: 1,
    activeFrameWeight: 0
  },
  lightTop: {
    position: createVector(-13, 21.5, 20.5),
    target: createVector(4.5, -1.5, 5),
    color: createColor(0xCAFF7C),
    intensity: 2.3,
    distance: 35,
    angle: 0.62,
    penumbra: 0.2,
    decay: 0.9,
    castShadow: true
  },
  lightBottom: {
    position: createVector(2, -14, 24.5),
    target: createVector(0, 5.5, 1),
    color: createColor(0xD1F08A),
    intensity: 2.4,
    distance: 40,
    angle: 0.59,
    penumbra: 0.2,
    decay: 0.75,
    castShadow: true
  },
  lightAmbient: {
    skyColor: createColor(0xBCADFF),
    groundColor: createColor(0xDBFFF4),
    intensity: 0.6
  }
}

const container = document.createElement('div')
const tasks = createTaskManager('update', 'render')
const renderer = createRenderer()
const scene = createScene()
const camera = createCamera()

function createRenderer () {
  const renderer = new WebGLRenderer({
    antialias: true
  })
  renderer.autoClear = false
  renderer.shadowMap.enabled = RENDER_SETTINGS.useShadow
  renderer.shadowMap.type = PCFSoftShadowMap
  return renderer
}

function createScene () {
  const scene = new Scene()
  scene.fog = new Fog()
  scene.helpers = new Group()
  scene.add(scene.helpers)
  return scene
}

function createCamera () {
  const camera = new PerspectiveCamera(1, 1, 0.1, 100)
  camera.controls = new TrackballControls(camera, container)
  Object.assign(camera.controls, {
    rotateSpeed: 1,
    zoomSpeed: 0.8,
    panSpeed: 0.1,
    noZoom: false,
    noPan: false,
    dynamicDampingFactor: 0.3,
    minDistance: 18,
    maxDistance: 30
  })
  tasks.add(camera.controls, 'update')
  return camera
}

function createSpotLight () {
  const light = new SpotLight()
  const { shadowMapSize } = RENDER_SETTINGS
  light.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  return light
}

function createHemiLight () {
  return new HemisphereLight()
}

const lights = {
  top: createSpotLight(),
  bottom: createSpotLight(),
  ambient: createHemiLight()
}
Object.keys(lights).forEach((key) => {
  scene.add(lights[key])
})

const dinild = new Dinild({
  castShadow: RENDER_SETTINGS.useShadow,
  receiveShadow: RENDER_SETTINGS.useShadow,
  useSubsurface: RENDER_SETTINGS.useSubsurface
})
dinild.load()
dinild.addTo(scene)
tasks.add(dinild, 'update')
tasks.add(dinild, 'render')

const index = new SceneState({
  camera,
  renderer,
  scene,
  tasks
})
function updateState (nextState) {
  index.updateCamera(nextState.camera)
  index.updateFog(nextState.fog)
  index.updatePose(dinild.pose, dinild.mesh, nextState.pose)
  index.updateSkinMaterial(dinild.material, nextState.skin)
  index.updateSpotLight(lights.top, nextState.lightTop)
  index.updateSpotLight(lights.bottom, nextState.lightBottom)
  index.updateHemiLight(lights.ambient, nextState.lightAmbient)
}

Object.assign(container.style, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden'
})
container.appendChild(renderer.domElement)
document.body.appendChild(container)
window.addEventListener('resize', resize)
updateState(state)
resize()

function resize () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.controls.handleResize()
  render()
}

function modulateSinPrime (t) {
  const { sin } = Math
  return sin(
    sin(17 * t) +
    sin(23 * t) +
    sin(41 * t) +
    sin(59 * t) +
    sin(127 * t))
}

function modulateIntensity (intensity, scaleMin, t) {
  const base = 1// Math.min(1, t * t * 200)
  return base * mapLinear(-1, 1,
    intensity * scaleMin, intensity,
    modulateSinPrime(t))
}

function animateLights (frame) {
  lights.top.intensity = modulateIntensity(state.lightTop.intensity,
    0.65, frame * 0.0021)
  lights.bottom.intensity = modulateIntensity(state.lightBottom.intensity,
    0.75, frame * 0.0022)
  lights.ambient.intensity = modulateIntensity(state.lightAmbient.intensity,
    0.85, frame * 0.0020)
}
tasks.add(animateLights, 'update')

const loop = createLoop(null, update, render)
let animationFrame = 0
function update () {
  tasks.run('update', animationFrame++)
}
function render () {
  renderer.clear()
  tasks.run('render', renderer, scene, camera)
  renderer.render(scene, camera)
}

loop.start()
document.addEventListener('keyup', (event) => {
  switch (event.which) {
    case 32:
      loop.toggle()
      event.preventDefault()
      break
  }
})

// FIXME
// #ifdef DEVELOPMENT
require('./index-debug').createDebug({
  renderer,
  scene,
  camera,
  state,
  updateState
})
// #endif
