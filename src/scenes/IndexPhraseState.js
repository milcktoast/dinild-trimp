import { WORDS } from '../constants/phrase'
import { MOUTH_FRAMES_SHAPE_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'
import {
  parsePhrase,
  spacePhrase
} from '../animations/PhraseAnimation'

export function IndexPhraseState (context) {
  this.context = context
  this.state = this.createState()
  this.bindEvents(context)
}

inherit(null, IndexPhraseState, {
  createState () {
    return {
      phraseSequence: null,
      words: []
    }
  },

  bindEvents (context) {
    const { controls } = context.camera
    controls.addEventListener('add', this.onSelectionAdd.bind(this))
  },

  onSelectionAdd (event) {
    const { state } = this
    const { words } = state
    const { which } = event

    const nextWords = words.concat(WORDS[which])
    state.phraseSequence = spacePhrase(parsePhrase(nextWords, false, MOUTH_FRAMES_SHAPE_MAP))
    state.words = nextWords

    console.log(state.phraseSequence)

    this.syncState()
  },

  syncState () {
    this.updateState(this.state)
  },

  updateState (nextState) {
    const { dinild } = this.context.entities
    if (!dinild) return
    dinild.phrase.setSequence(this.state.phraseSequence)
  }
})
