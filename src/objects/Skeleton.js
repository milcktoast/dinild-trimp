import {
  Object3D,
  Skeleton as BaseSkeleton
} from 'three'

import { inherit } from '../utils/ctor'

export function Skeleton (bones, boneInverses, useVertexTexture) {
  Object3D.call(this)

  this.applyHierarchy(bones)
  BaseSkeleton.call(this, bones, boneInverses, useVertexTexture)

  this.type = 'Skeleton'
}

inherit(Object3D, Skeleton, BaseSkeleton.prototype, {
  applyHierarchy (bones) {
    bones.forEach((bone, index) => {
      const hasParentBone = bone.parentIndex !== -1 &&
        bone.parentIndex != null &&
        bones[bone.parentIndex] != null

      if (hasParentBone) {
        bones[bone.parentIndex].add(bones[index])
      } else {
        this.add(bones[index])
      }
    })
  }
})
