import { WORD_LOCATIONS } from '../constants/phrase'
import { inherit } from '../utils/ctor'
import { Dinild } from '../entities/Dinild'
import { Needle } from '../entities/Needle'
import { NeedleGroup } from '../entities/NeedleGroup'

export function IndexEntities () {}

inherit(null, IndexEntities, {
  load () {
    return Promise.all([
      Dinild.load(),
      Needle.load()
    ])
  },

  // TODO: Cleanup loading, promise chain
  populate (scene, camera, settings) {
    const { useSubsurface, useShadow, textureQuality } = settings
    return Promise.all([
      Dinild.load(),
      Dinild.loadTextures(textureQuality)
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
    .then(Needle.load())
    .then(() => {
      this.needles = new NeedleGroup({
        castShadow: useShadow,
        receiveShadow: false
      })
      this.needleCursor = new Needle({
        castShadow: useShadow,
        receiveShadow: false
      })
      return Promise.all([
        this.needles.addTo(this.dinild),
        this.needleCursor.addTo(this.dinild)
      ])
    })
    .then(() => {
      const { dinild, needleCursor } = this
      const { controls } = camera
      controls.cursorEntity = needleCursor
      controls.targetEntity = dinild
      controls.targetOptionUVs = WORD_LOCATIONS
      controls.addEventListener('add', this.onSelectionAdd.bind(this))
      return this
    })
  },

  onSelectionAdd (event) {
    const { needles, needleCursor } = this
    needles.addInstanceFrom(needleCursor)
  },

  update (frame, state) {
    this.dinild.update()
  },

  render (renderer, scene, camera) {
    this.needles.render(renderer, scene, camera)
    this.needleCursor.render(renderer, scene, camera)
    this.dinild.render(renderer, scene, camera)
  }
})
