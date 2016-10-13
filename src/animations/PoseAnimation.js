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
  const frameCount = boneFrames[0].length - 1 // First frame is rest pose
  this.boneFrames = boneFrames
  this.weights = new Float32Array(frameCount)
}

inherit(PoseAnimation)
Object.assign(PoseAnimation.prototype, {
  resetWeights () {
    const { weights } = this
    for (let i = 0; i < weights.length; i++) {
      weights[i] = 0
    }
  },

  // TODO: Transform scale
  applyWeights (bones) {
    const { boneFrames, weights } = this
    for (let i = 0; i < bones.length; i++) {
      const actionFrames = boneFrames[i]
      const bone = bones[i]
      const pos = bone.position
      const rot = bone.quaternion

      // Reset bone to rest position
      const restFrame = actionFrames[0]
      pos.copy(restFrame.pos)
      rot.copy(restFrame.rot)

      for (let j = 0; j < weights.length; j++) {
        const weight = weights[j]
        if (!weight) continue

        // Skip first frame which is rest position
        const frame = actionFrames[j + 1]
        scratchVec3.copy(restFrame.pos).lerp(frame.pos, weight)
        scratchVec3.sub(restFrame.pos)
        pos.add(scratchVec3)

        scratchQuat.copy(restFrame.rot)
        nlerpQuat(scratchQuat, frame.rot, weight)
        subQuat(scratchQuat, restFrame.rot)
        addQuat(rot, scratchQuat)
      }
    }
  }
})
