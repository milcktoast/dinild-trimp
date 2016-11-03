import { inherit } from '../utils/ctor'
import { LoadSpinner } from '../ui-components/LoadSpinner'
import { PhraseMap } from '../ui-components/PhraseMap'

export function IndexInterface () {}

inherit(null, IndexInterface, {
  inject (container) {
    this.loader = new LoadSpinner()
    this.phraseMap = new PhraseMap()
    this.loader.appendTo(container)
    this.phraseMap.appendTo(container)
    return Promise.resolve()
  },

  showLoader () {
    this.loader.opacity = 1
  },

  hideLoader () {
    this.loader.opacity = 0
  },

  render () {
    this.loader.render()
    this.phraseMap.render()
  }
})
