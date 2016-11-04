import { inherit } from '../utils/ctor'
import { IntroModal } from '../ui-components/IntroModal'
import { LoadSpinner } from '../ui-components/LoadSpinner'
import { PhraseMap } from '../ui-components/PhraseMap'

export function IndexInterface () {}

inherit(null, IndexInterface, {
  inject (container) {
    this.intro = new IntroModal()
    this.loader = new LoadSpinner()
    this.phraseMap = new PhraseMap()
    this.loader.appendTo(container)
    this.phraseMap.appendTo(container)
    return Promise.resolve()
  },

  bindEnter (fn) {
    this.intro.addEventListener('enter', fn)
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
