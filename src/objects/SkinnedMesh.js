import {
  Matrix4,
  Mesh,
  SkinnedMesh as BaseSkinnedMesh
} from 'three'

import { inherit } from '../utils/ctor'

export function SkinnedMesh (geometry, material) {
  Mesh.call(this, geometry, material)

  this.type = 'SkinnedMesh'

  this.bindMode = 'attached'
  this.bindMatrix = new Matrix4()
  this.bindMatrixInverse = new Matrix4()

  this.normalizeSkinWeights()
  this.updateMatrixWorld(true)
}

inherit(Mesh, SkinnedMesh, BaseSkinnedMesh.prototype)
