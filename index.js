import {
  Color,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  PointLightHelper,
  Scene,
  TextureLoader,
  WebGLRenderer
} from 'three'
import { TrackballControls } from './vendor/three/TrackballControls'
// import { TransformControls } from './vendor/three/TransformControls'
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
    position: createVector(-10, 13, 10),
    color: createColor(0x3F49FF),
    intensity: 2.3,
    distance: 25.5
  },
  lightB: {
    position: createVector(7.5, -6.5, 26),
    color: createColor(0xBB97FF),
    intensity: 2.4,
    distance: 27
  },
  lightHemi: {
    skyColor: createColor(0x5549FF),
    groundColor: createColor(0x162DFF),
    intensity: 1.3
  }
}

const container = document.createElement('div')
const renderer = new WebGLRenderer()
const scene = new Scene()
const sceneHelpers = new Group()
scene.add(sceneHelpers)

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

const lightA = new PointLight()
const lightB = new PointLight()
const lightHemi = new HemisphereLight()
scene.add(lightA, lightB, lightHemi)
sceneHelpers.add(
  new PointLightHelper(lightA, 1),
  new PointLightHelper(lightB, 1))

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
  return new Mesh(geometry, material)
}

function updateState (nextState) {
  updatePointLight(lightA, nextState.lightA)
  updatePointLight(lightB, nextState.lightB)
  updateHemiLight(lightHemi, nextState.lightHemi)
}

function updatePointLight (light, state) {
  light.color.copy(state.color)
  light.position.copy(state.position)
  light.intensity = state.intensity
  light.distance = state.distance
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
  render()
}

function render () {
  renderer.render(scene, camera)
}
