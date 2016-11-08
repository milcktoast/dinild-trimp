import {
  BufferGeometry,
  BufferAttribute,
  SkinnedMesh
} from 'three'

import { inherit } from '../utils/ctor'
import { Entity } from '../mixins/Entity'
import { CrystalMaterial } from '../materials/CrystalMaterial'
import { Needle } from './Needle'

export function NeedleGroup (params) {
  this.instanceCount = 0
  this.maxInstances = 100
  this.verticesPerInstance = 36

  this.castShadow = params.castShadow
  this.receiveShadow = params.receiveShadow
  this.textureQuality = params.textureQuality
}

inherit(null, NeedleGroup, Entity, {
  createMaterial (textures) {
    const material = new CrystalMaterial({
      // color: 0xffffff,
      normalMap: textures.normal,
      skinning: true,
      transparent: true
    })
    this.renderMaterial = material.render.bind(material)
    return material
  },

  createGeometry () {
    const { maxInstances, verticesPerInstance } = this
    const vertsCount = maxInstances * verticesPerInstance

    const geometry = new BufferGeometry()
    const position = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    const normal = new BufferAttribute(new Float32Array(vertsCount * 3), 3)
    const uv = new BufferAttribute(new Float32Array(vertsCount * 2), 2)
    const skinIndex = new BufferAttribute(new Float32Array(vertsCount * 4), 4)
    const skinWeight = new BufferAttribute(new Float32Array(vertsCount * 4), 4)

    geometry.addAttribute('position', position)
    geometry.addAttribute('normal', normal)
    geometry.addAttribute('uv', uv)
    geometry.addAttribute('skinIndex', skinIndex)
    geometry.addAttribute('skinWeight', skinWeight)

    return geometry
  },

  createItem () {
    return Needle.load(this.textureQuality).then(({ textures }) => {
      const { castShadow, receiveShadow } = this
      const geometry = this.createGeometry()
      const material = this.createMaterial(textures)
      const item = new SkinnedMesh(geometry, material)

      Object.assign(item, {
        castShadow,
        receiveShadow
      })

      Object.assign(this, {
        item, material
      })

      return this
    })
  },

  addInstanceFrom (entity) {
    const instanceCount = this.instanceCount++
    const itemFrom = entity.item
    const { skinIndex, skinWeight } = entity
    const { item, verticesPerInstance } = this
    const { matrixWorld } = itemFrom

    const geomFrom = itemFrom.geometry
    const geomItem = item.geometry

    const positionFrom = geomFrom.getAttribute('position')
    const positionItem = geomItem.getAttribute('position')
    const normalFrom = geomFrom.getAttribute('normal')
    const normalItem = geomItem.getAttribute('normal')
    const uvFrom = geomFrom.getAttribute('uv')
    const uvItem = geomItem.getAttribute('uv')
    const skinIndexItem = geomItem.getAttribute('skinIndex')
    const skinWeightItem = geomItem.getAttribute('skinWeight')

    for (let i = 0; i < verticesPerInstance; i++) {
      const offset = instanceCount * verticesPerInstance + i
      positionItem.copyAt(offset, positionFrom, i)
      normalItem.copyAt(offset, normalFrom, i)
      uvItem.copyAt(offset, uvFrom, i)
      skinIndexItem.setXYZW(offset, skinIndex.x, skinIndex.y, skinIndex.z, skinIndex.w)
      skinWeightItem.setXYZW(offset, skinWeight.x, skinWeight.y, skinWeight.z, skinWeight.w)
    }

    matrixWorld.applyToBuffer(positionItem,
      instanceCount * verticesPerInstance, verticesPerInstance)

    geomItem.drawRange.count = (instanceCount + 1) * verticesPerInstance
    positionItem.needsUpdate = true
    normalItem.needsUpdate = true
    uvItem.needsUpdate = true
    skinIndexItem.needsUpdate = true
    skinWeightItem.needsUpdate = true
  },

  renderMaterial () {},

  render (renderer, scene, camera) {
    this.renderMaterial(renderer, scene, camera)
  }
})
