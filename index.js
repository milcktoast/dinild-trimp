import {
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  WebGLRenderer
} from 'three'

import { parseModel } from './utils/model'
import dinildJSON from './assets/models/dinild.json'

var camera, scene, renderer
var geometry, material, mesh, light

init()
animate()

function init () {
  scene = new Scene()

  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.y = 1.5
  camera.position.z = -5
  camera.lookAt(scene.position)

  const model = parseModel(dinildJSON)
  geometry = model.geometry
  console.log(geometry)
  material = new MeshStandardMaterial({
    // color: 0x999999
  })

  mesh = new Mesh(geometry, material)
  scene.add(mesh)

  light = new PointLight(0xffffff, 2, 10)
  light.position.z = -5
  scene.add(light)

  renderer = new WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)

  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    top: 0,
    left: 0
  })
  document.body.appendChild(renderer.domElement)
}

function animate () {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
