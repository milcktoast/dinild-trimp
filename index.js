import {
  Color,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  RGBFormat,
  Scene,
  SpotLight,
  SpotLightHelper,
  TextureLoader,
  WebGLRenderer
} from 'three'
import { TrackballControls } from './vendor/three/TrackballControls'
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

const cameraOptions = [{
  position: createVector(6, -1, 22),
  target: createVector(-1.5, 0.5, 0),
  up: createVector(0, 1, 0),
  fov: 92
}, {
  position: createVector(-5, 0, 22),
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
    color: createColor(0x222222),
    near: 10.6,
    far: 17.2
  },
  skin: {
    shininess: 30,
    normalScale: 1.35,
    textureAnisotropy: 4
  },
  lightTop: {
    position: createVector(-2.5, 18.5, 15.5),
    target: createVector(0, 0, 0),
    color: createColor(0x3F49FF),
    intensity: 2.3,
    distance: 22,
    angle: 0.62,
    penumbra: 0.2,
    decay: 2
  },
  lightBottom: {
    position: createVector(8.5, -6.5, 26),
    target: createVector(0, 0, 0),
    color: createColor(0xBB97FF),
    intensity: 4,
    distance: 42,
    angle: Math.PI / 4,
    penumbra: 0,
    decay: 2
  },
  lightAmbient: {
    skyColor: createColor(0x5549FF),
    groundColor: createColor(0x162DFF),
    intensity: 2.7
  }
}

const container = document.createElement('div')
const renderer = new WebGLRenderer()
const scene = new Scene()
scene.fog = new Fog()
const sceneHelpers = new Group()
scene.add(sceneHelpers)

// TODO: Cleanup
function addSpotlightHelper (light) {
  const helper = new SpotLightHelper(light)
  light.helper = helper
  sceneHelpers.add(helper)
}

const camera = new PerspectiveCamera(1, 1, 0.1, 100)
const cameraControls = new TrackballControls(camera, container)
cameraControls.rotateSpeed = 1
cameraControls.zoomSpeed = 0.02
cameraControls.panSpeed = 0.1
cameraControls.noZoom = false
cameraControls.noPan = false
cameraControls.dynamicDampingFactor = 0.3

const lightTop = new SpotLight()
const lightBottom = new SpotLight()
const lightAmbient = new HemisphereLight()
scene.add(lightTop, lightBottom, lightAmbient)

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
cameraControls.addEventListener('change', () => {
  copyVector(state.camera.position, camera.position)
  copyVector(state.camera.up, camera.up)
  copyVector(state.camera.target, cameraControls.target)
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
  const material = new MeshPhongMaterial({
    map: loadTexture('./assets/textures/dinild/diffuse.jpg'),
    normalMap: loadTexture('./assets/textures/dinild/normal.jpg')
  })
  const mesh = new Mesh(geometry, material)
  // Object.assign(mesh, {
  //   castShadow: true,
  //   receiveShadow: true
  // })
  return mesh
}

function updateState (nextState) {
  updateCamera(nextState.camera)
  updateFog(nextState.fog)
  updateSkinMaterial(dinild.material, nextState.skin)
  updateSpotLight(lightTop, nextState.lightTop)
  updateSpotLight(lightBottom, nextState.lightBottom)
  updateHemiLight(lightAmbient, nextState.lightAmbient)
}

function updateCamera (state) {
  camera.position.copy(state.position)
  camera.up.copy(state.up).normalize()
  camera.fov = state.fov
  cameraControls.target.copy(state.target)
  camera.updateProjectionMatrix()
}

function updateFog (state) {
  renderer.setClearColor(state.color)
  scene.fog.color.copy(state.color)
  scene.fog.near = state.near
  scene.fog.far = state.far
}

function updateSkinMaterial (material, state) {
  const { map, normalMap } = material
  material.shininess = state.shininess
  material.normalScale.set(state.normalScale, state.normalScale)
  if (map.anisotropy !== state.textureAnisotropy) {
    map.anisotropy = state.textureAnisotropy
    normalMap.anisotropy = state.textureAnisotropy
    if (map.image) map.needsUpdate = true
    if (normalMap.image) normalMap.needsUpdate = true
  }
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
  cameraControls.handleResize()
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

let frame = 0
function animate () {
  lightTop.intensity = modulateIntensity(state.lightTop.intensity,
    0.65, frame * 0.0031)
  lightBottom.intensity = modulateIntensity(state.lightBottom.intensity,
    0.75, frame * 0.0032)
  lightAmbient.intensity = modulateIntensity(state.lightAmbient.intensity,
    0.85, frame * 0.0030)

  sceneHelpers.children.forEach((child) => {
    child.update && child.update()
  })
  cameraControls.update()

  window.requestAnimationFrame(animate)
  render()
  frame++
}

function render () {
  renderer.render(scene, camera)
}
