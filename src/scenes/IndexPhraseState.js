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
      activeWord: null,
      selectedWords: [],
      phraseSequence: null
    }
  },

  bindEvents (context) {
    const { controls } = context.camera
    controls.addEventListener('add', this.onSelectionAdd.bind(this))
  },

  bindPhrase (phrase) {
    phrase.addEventListener('sequenceStart', this.onSequenceStart.bind(this))
    phrase.addEventListener('sequenceEnd', this.onSequenceEnd.bind(this))
    this.hasBoundPhrase = true
  },

  onSelectionAdd (event) {
    const { state } = this
    const { which } = event

    const activeWord = WORDS[which]
    const selectedWords = state.selectedWords.concat(WORDS[which])
    const phraseSequence = spacePhrase(
      parsePhrase([activeWord], false, MOUTH_FRAMES_SHAPE_MAP))

    Object.assign(state, {
      activeWord,
      selectedWords,
      phraseSequence
    })

    this.syncState()
  },

  onSequenceStart (event) {
    const { controls } = this.context.camera
    controls.enableCursor = false
  },

  onSequenceEnd (event) {
    const { controls } = this.context.camera
    controls.enableCursor = true
  },

  syncState () {
    this.updateState(this.state)
  },

  updateState (nextState) {
    const { dinild } = this.context.entities
    if (!dinild) return
    if (!this.hasBoundPhrase) this.bindPhrase(dinild.phrase) // FIXME maybe
    dinild.phrase.setSequence(this.state.phraseSequence)
  }
})
