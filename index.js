import {
  Color,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RGBFormat,
  Scene,
  SpotLight,
  SpotLightHelper,
  TextureLoader,
  WebGLRenderer
} from 'three'

import { TrackballControls } from './controls/TrackballControls'
import { SkinMaterial } from './materials/SkinMaterial'
import { createTaskManager } from './utils/task'
import { mapLinear } from './utils/math'
import { parseModel } from './utils/model'
import {
  annotateState,
  createStateControls
} from './utils/oui'

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

const renderSettings = {
  skinSubsurface: true
}

const cameraOptions = [{
  position: createVector(6, -1, 22),
  target: createVector(-1.5, 0.5, 0),
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
const cameraStart = cameraOptions[1]

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
  lightTop: {
    position: createVector(-10, 24, 14.5),
    target: createVector(0, 0, 10.5),
    color: createColor(0xCAFF7C),
    intensity: 2.3,
    distance: 45,
    angle: 0.62,
    penumbra: 0.2,
    decay: 0.9,
    castShadow: false
  },
  lightBottom: {
    position: createVector(2, -14, 24.5),
    target: createVector(0, 5.5, 1),
    color: createColor(0xD2BAFF),
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
    intensity: 0.7
  }
}

const container = document.createElement('div')
const tasks = createTaskManager('update', 'render')
const renderer = createRenderer()
const scene = createScene()
const camera = createCamera()

function createRenderer () {
  const renderer = new WebGLRenderer()
  renderer.autoClear = false
  renderer.shadowMap.enabled = true
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
    zoomSpeed: 0.02,
    panSpeed: 0.1,
    noZoom: false,
    noPan: false,
    dynamicDampingFactor: 0.3
  })
  tasks.add(camera.controls, 'update')
  return camera
}

// TODO: Cleanup
function addSpotlightHelper (light) {
  const helper = new SpotLightHelper(light)
  light.helper = helper
  scene.helpers.add(helper)
  tasks.add(helper, 'update')
}

function createSpotLight () {
  const light = new SpotLight()
  light.shadow.mapSize.set(1024, 1024)
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

const dinild = createDinild()
scene.add(dinild)

Object.assign(container.style, {
  position: 'absolute',
  top: 0,
  left: 0
})
container.appendChild(renderer.domElement)
document.body.appendChild(container)
window.addEventListener('resize', resize)
updateState(state)
resize()
animate()

const oui = createStateControls({label: 'Settings'})
annotateState(state)
oui(state, updateState)
camera.controls.addEventListener('change', () => {
  copyVector(state.camera.position, camera.position)
  copyVector(state.camera.up, camera.up)
  copyVector(state.camera.target, camera.controls.target)
  oui(state, updateState)
})

let textureLoader
function loadTexture (src) {
  if (!textureLoader) textureLoader = new TextureLoader()
  const texture = textureLoader.load(src)
  texture.format = RGBFormat
  return texture
}

function createDinild () {
  const dinildJSON = require('./assets/models/dinild.json')
  const { geometry } = parseModel(dinildJSON)
  const MaterialCtor = renderSettings.skinSubsurface
    ? SkinMaterial
    : MeshPhongMaterial
  const material = new MaterialCtor({
    map: loadTexture('./assets/textures/dinild/diffuse.jpg'),
    normalMap: loadTexture('./assets/textures/dinild/normal.jpg')
  })
  const mesh = new Mesh(geometry, material)
  Object.assign(mesh, {
    castShadow: true,
    receiveShadow: true
  })
  if (material.render) tasks.add(material, 'render')
  return mesh
}

function updateState (nextState) {
  updateCamera(nextState.camera)
  updateFog(nextState.fog)
  updateSkinMaterial(dinild.material, nextState.skin)
  updateSpotLight(lights.top, nextState.lightTop)
  updateSpotLight(lights.bottom, nextState.lightBottom)
  updateHemiLight(lights.ambient, nextState.lightAmbient)
}

function updateCamera (state) {
  camera.position.copy(state.position)
  camera.up.copy(state.up).normalize()
  camera.fov = state.fov
  camera.controls.target.copy(state.target)
  camera.updateProjectionMatrix()
}

function updateFog (state) {
  renderer.setClearColor(state.color)
  scene.fog.color.copy(state.color)
  scene.fog.near = state.near
  scene.fog.far = state.far
}

function updateSkinMaterial (material, state) {
  // const { map, normalMap } = material
  // material.shininess = state.shininess
  // material.normalScale.set(state.normalScale, state.normalScale)
  // if (map.anisotropy !== state.textureAnisotropy) {
  //   map.anisotropy = state.textureAnisotropy
  //   normalMap.anisotropy = state.textureAnisotropy
  //   if (map.image) map.needsUpdate = true
  //   if (normalMap.image) normalMap.needsUpdate = true
  // }
}

function updateLight (light, state) {
  light.color.copy(state.color)
  light.position.copy(state.position)
  light.intensity = state.intensity
  light.castShadow = state.castShadow
}

function updateSpotLight (light, state) {
  updateLight(light, state)
  light.target.position.copy(state.target)
  light.target.updateMatrixWorld()
  light.distance = state.distance
  light.angle = state.angle
  light.penumbra = state.penumbra
  light.decay = state.decay
  if (state.helper && !light.helper) addSpotlightHelper(light)
  if (light.helper) light.helper.visible = !!state.helper
}

function updateHemiLight (light, state) {
  light.color.copy(state.skyColor)
  light.groundColor.copy(state.groundColor)
  light.intensity = state.intensity
}

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

let animationFrame = 0
function animate () {
  tasks.run('update', animationFrame++)
  render()
  window.requestAnimationFrame(animate)
}

function render () {
  renderer.clear()
  tasks.run('render', renderer, scene, camera)
  renderer.render(scene, camera)
}
