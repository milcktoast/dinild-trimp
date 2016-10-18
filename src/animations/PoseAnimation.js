import {
  Quaternion,
  Vector3
} from 'three'
import { inherit } from '../utils/ctor'
import {
  add as addQuat,
  sub as subQuat,
  nlerp as nlerpQuat
} from '../utils/quaternion'

const scratchQuat = new Quaternion()
const scratchVec3 = new Vector3()

export function PoseAnimation (boneFrames) {
  const frameCount = boneFrames[0].length
  this.boneFrames = boneFrames
  this.weights = new Float32Array(frameCount)
}

inherit(null, PoseAnimation, {
  resetWeights () {
    const { weights } = this
    for (let i = 0; i < weights.length; i++) {
      weights[i] = 0
    }
  },

  applyWeights (bones) {
    const { boneFrames, weights } = this
    for (let i = 0; i < bones.length; i++) {
      const actionFrames = boneFrames[i]
      const bone = bones[i]
      const { position, quaternion, scale } = bone

      // Reset bone to rest position
      const restFrame = actionFrames[0]
      position.copy(restFrame.pos)
      quaternion.copy(restFrame.rot)
      scale.copy(restFrame.scl)

      for (let j = 0; j < weights.length; j++) {
        const weight = weights[j]
        const frame = actionFrames[j]
        if (weight === 0) continue

        scratchVec3.copy(restFrame.pos).lerp(frame.pos, weight)
        scratchVec3.sub(restFrame.pos)
        position.add(scratchVec3)

        scratchVec3.copy(restFrame.scl).lerp(frame.scl, weight)
        scratchVec3.sub(restFrame.scl)
        scale.add(scratchVec3)

        scratchQuat.copy(restFrame.rot)
        nlerpQuat(scratchQuat, frame.rot, weight)
        subQuat(scratchQuat, restFrame.rot)
        addQuat(quaternion, scratchQuat)
      }
    }
  }
})
