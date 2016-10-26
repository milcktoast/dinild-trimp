import {
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
import { WORD_LOCATIONS } from './constants/phrase'

import { createTaskManager } from './utils/task'
import { createLoop } from './utils/loop'
import { TrackballControls } from './controls/TrackballControls'
import { SelectionControls } from './controls/SelectionControls'
import { mapLinear } from './utils/math'
import { IndexSceneState } from './state/IndexSceneState'
import { Dinild } from './entities/Dinild'
import { Needle } from './entities/Needle'
import { NeedleGroup } from './entities/NeedleGroup'

const container = createContainer()
const tasks = createTaskManager(
  'load', 'syncState', 'update', 'render', 'resize')
const renderer = createRenderer()
const scene = createScene()
const camera = createCamera()
const loop = createAnimationLoop()

function createContainer () {
  const element = document.createElement('div')
  Object.assign(element.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  })
  return element
}

function createRenderer () {
  const renderer = new WebGLRenderer({
    antialias: true
  })
  renderer.autoClear = false
  renderer.shadowMap.type = PCFSoftShadowMap
  tasks.add(() => {
    renderer.setSize(window.innerWidth, window.innerHeight)
  }, 'resize')
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
  const controls = new TrackballControls(camera, container)
  const selection = new SelectionControls(camera, container)

  Object.assign(camera, {
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

  tasks.add((frame) => {
    controls.update(frame)
    selection.update(frame)
  }, 'update')
  tasks.add(() => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    controls.resize()
    selection.resize()
  }, 'resize')

  return camera
}

function createAnimationLoop () {
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
  return loop
}

// Events

window.addEventListener('resize', (event) => {
  tasks.run('resize', event)
}, false)

// Lights

const lights = {}

function createSpotLight ({ shadowMapSize }) {
  const light = new SpotLight()
  light.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  return light
}

function createHemiLight () {
  return new HemisphereLight()
}

function createLights (settings) {
  lights.top = createSpotLight(settings)
  lights.bottom = createSpotLight(settings)
  lights.ambient = createHemiLight(settings)
  tasks.add(animateLights, 'update')
  Object.keys(lights).forEach((key) => {
    scene.add(lights[key])
  })
  tasks.run('syncState')
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
  const { state } = index
  lights.top.intensity = modulateIntensity(state.lightTop.intensity,
    0.65, frame * 0.0021)
  lights.bottom.intensity = modulateIntensity(state.lightBottom.intensity,
    0.75, frame * 0.0022)
  lights.ambient.intensity = modulateIntensity(state.lightAmbient.intensity,
    0.85, frame * 0.0020)
}

// Entities

const entities = {}
const loadDinild = tasks.defer(Dinild, 'load')
const loadNeedle = tasks.defer(Needle, 'load')

function createEntities (settings) {
  const {
    useSubsurface,
    useShadow,
    textureQuality
  } = settings

  loadDinild.then(() => {
    const dinild = new Dinild({
      castShadow: useShadow,
      receiveShadow: useShadow,
      useSubsurface,
      textureQuality
    })
    entities.dinild = dinild
    dinild.addTo(scene)
    // tasks.add(dinild, 'update')
    tasks.add(dinild, 'render')
    tasks.run('syncState')
  })

  Promise.all([loadDinild, loadNeedle]).then(() => {
    const { dinild } = entities
    const needles = new NeedleGroup({
      castShadow: useShadow,
      receiveShadow: false
    })
    const needleCursor = new Needle({
      castShadow: useShadow,
      receiveShadow: false
    })
    return Promise.all([
      needleCursor.addTo(dinild),
      needles.addTo(dinild)
    ])
  }).then(([needleCursor, needles]) => {
    const { dinild } = entities
    const { selection } = camera
    entities.needleCursor = needleCursor
    entities.needles = needles
    selection.cursorEntity = needleCursor
    selection.targetEntity = dinild
    selection.targetOptionUVs = WORD_LOCATIONS
    selection.addEventListener('add', (event) => {
      console.log(event)
      needles.addInstanceFrom(needleCursor)
    })
  })
}

// Link state to scene

const index = new IndexSceneState({
  camera,
  renderer,
  scene,
  lights,
  entities
})
tasks.add(index, 'syncState')

// Start

function inject () {
  container.appendChild(renderer.domElement)
  document.body.appendChild(container)
  tasks.run('resize')
}

function load () {
  tasks.flush('load')
}

function start () {
  tasks.run('syncState')
  loop.start()
}

inject()
setTimeout(() => {
  const settings = RENDER_SETTINGS.LOW
  renderer.shadowMap.enabled = settings.useShadow
  load()
  start()
  createLights(settings)
  createEntities(settings)
}, 0)

// FIXME
// #ifdef DEVELOPMENT
require('./index-debug').createDebug({
  renderer,
  scene,
  camera,
  loop,
  state: index.state,
  updateState: index.updateState.bind(index)
})
// #endif
