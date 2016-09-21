import {
  Color,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SpotLight,
  SpotLightHelper,
  TextureLoader,
  WebGLRenderer
} from 'three'
import { TrackballControls } from './vendor/three/TrackballControls'
import { parseModel } from './utils/model'
import { createStateControls } from './utils/oui'
import dinildJSON from './assets/models/dinild.json'

function createVector (x, y, z) {
  return { x, y, z }
}

function createColor (...args) {
  return new Color(...args)
}

const state = {
  lightA: {
    position: createVector(-5.5, 21.5, 12.5),
    target: createVector(0, 0, 0),
    color: createColor(0x3F49FF),
    intensity: 2.8,
    distance: 27,
    angle: Math.PI / 4,
    penumbra: 0,
    decay: 2
  },
  lightB: {
    position: createVector(8.5, -6.5, 26),
    target: createVector(0, 0, 0),
    color: createColor(0xBB97FF),
    intensity: 3.2,
    distance: 26,
    angle: Math.PI / 4,
    penumbra: 0,
    decay: 2
  },
  lightHemi: {
    skyColor: createColor(0x5549FF),
    groundColor: createColor(0x162DFF),
    intensity: 1.2
  }
}

const container = document.createElement('div')
const renderer = new WebGLRenderer()

const scene = new Scene()
const sceneHelpers = new Group()
scene.add(sceneHelpers)

// TODO: Cleanup
function addSpotlightHelper (light) {
  const helper = new SpotLightHelper(light)
  light.helper = helper
  sceneHelpers.add(helper)
}

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.set(6, 0, 32)

const controls = new TrackballControls(camera, container)
controls.target.set(-1, 1.5, 0)
controls.rotateSpeed = 1
controls.zoomSpeed = 0.02
controls.panSpeed = 0.1
controls.noZoom = false
controls.noPan = false
controls.dynamicDampingFactor = 0.3

const lightA = new SpotLight()
const lightB = new SpotLight()
const lightHemi = new HemisphereLight()
scene.add(lightA, lightB, lightHemi)

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
resize()
animate()

updateState(state)
createStateControls(state, updateState)

function createDinild () {
  const { geometry } = parseModel(dinildJSON)
  const loader = new TextureLoader()
  const map = loader.load('./assets/textures/dinild/diffuse.jpg')
  const normalMap = loader.load('./assets/textures/dinild/normal.jpg')
  const material = new MeshPhongMaterial({
    shininess: 20,
    map,
    normalMap
  })
  const mesh = new Mesh(geometry, material)
  // Object.assign(mesh, {
  //   castShadow: true,
  //   receiveShadow: true
  // })
  return mesh
}

function updateState (nextState) {
  updateSpotLight(lightA, nextState.lightA)
  updateSpotLight(lightB, nextState.lightB)
  updateHemiLight(lightHemi, nextState.lightHemi)
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
  controls.handleResize()
  render()
}

function animate () {
  window.requestAnimationFrame(animate)
  controls.update()
  sceneHelpers.children.forEach((child) => {
    child.update && child.update()
  })
  render()
}

function render () {
  renderer.render(scene, camera)
}
