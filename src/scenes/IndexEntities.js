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

  populate (scene, camera, settings) {
    const {
      useSubsurface,
      useShadow,
      textureQuality
    } = settings

    return Promise.all([Dinild.load(), Needle.load()]).then(() => {
      const dinild = new Dinild({
        castShadow: useShadow,
        receiveShadow: useShadow,
        useSubsurface,
        textureQuality
      })
      const needles = new NeedleGroup({
        castShadow: useShadow,
        receiveShadow: false
      })
      const needleCursor = new Needle({
        castShadow: useShadow,
        receiveShadow: false
      })
      return Promise.all([
        dinild.addTo(scene),
        needleCursor.addTo(dinild),
        needles.addTo(dinild)
      ])
    }).then(([dinild, needleCursor, needles]) => {
      const { controls } = camera

      this.dinild = dinild
      this.needleCursor = needleCursor
      this.needles = needles

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
