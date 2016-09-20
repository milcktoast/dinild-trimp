import {
  Group,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  PointLightHelper,
  Scene,
  TextureLoader,
  WebGLRenderer
} from 'three'
import {
  annotate as ouiAnnotate,
  controls as ouiControls,
  oui
} from 'ouioui'
import { TrackballControls } from './vendor/three/TrackballControls'
// import { TransformControls } from './vendor/three/TransformControls'
import { parseModel } from './utils/model'
import dinildJSON from './assets/models/dinild.json'

function createVector (x, y, z) {
  return { x, y, z }
}

function createColor (r, g, b) {
  return { r, g, b }
}

const state = {
  lightA: annotateLight({
    // position: createVector(6, 18, 16),
    position: createVector(-10, 13, 10),
    color: createColor(1, 1, 1),
    intensity: 2.3,
    distance: 20
  }),
  lightB: annotateLight({
    // position: createVector(10, -8, 22),
    position: createVector(7.5, -6.5, 26),
    color: createColor(1, 1, 1),
    intensity: 2,
    distance: 50
  })
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
scene.add(lightA, lightB)
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
createStateControls()

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

function createStateControls () {
  oui(state, updateState)
}

function updateState (nextState) {
  updateLight(lightA, nextState.lightA)
  updateLight(lightB, nextState.lightB)
}

function annotateLight ({ position, color, intensity, distance }) {
  const annotateLightPosition = annotatePosition(16, 16, 16)
  return {
    position: annotateLightPosition(position),
    @ouiAnnotate({ control: ouiControls.ColorPicker })
    color,
    @ouiAnnotate({ min: 1, max: 4, step: 0.1 })
    intensity,
    @ouiAnnotate({ min: distance - 40, max: distance + 40, step: 0.5 })
    distance
  }
}

function annotatePosition (rangeX, rangeY, rangeZ) {
  return ({ x, y, z }) => {
    return {
      @ouiAnnotate({ min: x - rangeX, max: x + rangeX, step: 0.5 })
      x,
      @ouiAnnotate({ min: y - rangeY, max: y + rangeY, step: 0.5 })
      y,
      @ouiAnnotate({ min: z - rangeZ, max: z + rangeZ, step: 0.5 })
      z
    }
  }
}

function updateLight (light, state) {
  light.color.copy(state.color)
  light.position.copy(state.position)
  light.intensity = state.intensity
  light.distance = state.distance
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
