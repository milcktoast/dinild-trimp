import {
  Quaternion,
  Vector3
} from 'three'

import {
  add as addQuat,
  sub as subQuat,
  nlerp as nlerpQuat
} from '../utils/quaternion'

const scratchQuat = new Quaternion()
const scratchVec3 = new Vector3()

export function PoseAnimation (animation) {
  const frameCount = animation[0].length - 1 // First frame is rest pose
  this.animation = animation
  this.weights = new Float32Array(frameCount)
}

PoseAnimation.prototype.constructor = PoseAnimation
Object.assign(PoseAnimation.prototype, {
  // setAnimation (animation) {
  //   this.animation = animation;
  //   this.weights.length = animation[0].length;
  //   this.resetWeights();
  //   if (animation.isInitialized) { return; }
  //   animation.isInitialized = true;
  //   var boneKeys, key;
  //   for (var i = 0, il = animation.length; i < il; i ++) {
  //     boneKeys = animation[i];
  //     for (var j = 0, jl = boneKeys.length; j < jl; j ++) {
  //       key = boneKeys[j];
  //       key.pos = new THREE.Vector3().fromArray(key.pos);
  //       key.rot = new THREE.Quaternion().fromArray(key.rot);
  //     }
  //   }
  // },

  resetWeights () {
    const { weights } = this
    for (let i = 0; i < weights.length; i++) {
      weights[i] = 0
    }
  },

  // TODO: Transform scale
  applyWeights (bones) {
    const { animation, weights } = this
    for (let i = 0; i < bones.length; i++) {
      const boneFrames = animation[i]
      const bone = bones[i]
      const pos = bone.position
      const rot = bone.quaternion

      // Reset bone to rest position
      const restFrame = boneFrames[0]
      pos.copy(restFrame.pos)
      rot.copy(restFrame.rot)

      // Skip first key which is neutral position
      for (let j = 0; j < weights.length; j++) {
        const weight = weights[j]
        if (!weight) continue

        const frame = boneFrames[j + 1]
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
