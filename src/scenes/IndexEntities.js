import { WORD_LOCATIONS } from '../constants/phrase'
import { inherit } from '../utils/ctor'
import { createTaskManager } from '../utils/task'

import { Crowd } from '../entities/Crowd'
import { Dinild } from '../entities/Dinild'
import { Needle } from '../entities/Needle'
import { NeedleGroup } from '../entities/NeedleGroup'

export function IndexEntities () {
  this.tasks = createTaskManager('update', 'render')
}

inherit(null, IndexEntities, {
  preload () {
    return Promise.all([
      Dinild.preload(),
      Needle.preload(),
      Crowd.preload()
    ])
  },

  prepopulate (scene, camera, settings) {
    return Crowd.load().then(() => {
      this.crowd = new Crowd()
      this.tasks.add(this.crowd, 'update')
    })
  },

  populate (scene, camera, settings) {
    const { useSubsurface, useShadow, textureQuality } = settings
    return Promise.all([
      Dinild.load(textureQuality),
      Needle.load(textureQuality)
    ])
    .then(() => {
      this.dinild = new Dinild({
        castShadow: useShadow,
        receiveShadow: useShadow,
        useSubsurface,
        textureQuality
      })
      return this.dinild.addTo(scene)
    })
    .then(() => {
      this.needles = new NeedleGroup({
        castShadow: useShadow,
        receiveShadow: false,
        textureQuality
      })
      this.needleCursor = new Needle({
        castShadow: useShadow,
        receiveShadow: false,
        textureQuality
      })
      return Promise.all([
        this.needles.addTo(this.dinild),
        this.needleCursor.addTo(this.dinild)
      ])
    })
    .then(() => {
      const { dinild, needles, needleCursor, tasks } = this
      const { controls } = camera

      controls.cursorEntity = needleCursor
      controls.targetEntity = dinild
      controls.targetOptionUVs = WORD_LOCATIONS
      controls.addEventListener('add', this.onSelectionAdd.bind(this))

      tasks.add(dinild, 'update')
      tasks.add(dinild, 'render')
      tasks.add(needles, 'render')
      tasks.add(needleCursor, 'render')

      return this
    })
  },

  startCrowd () {
    this.crowd.playAudio()
  },

  onSelectionAdd (event) {
    const { needles, needleCursor } = this
    needles.addInstanceFrom(needleCursor)
  },

  update (frame, state) {
    this.tasks.run('update', frame, state)
  },

  render (renderer, scene, camera) {
    this.tasks.run('render', renderer, scene, camera)
  }
})
