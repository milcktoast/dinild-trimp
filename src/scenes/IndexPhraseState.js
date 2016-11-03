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
      activePosition: null,
      selectedWords: [],
      selectedPositions: [],
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
    const { uv, which } = event

    const activeWord = WORDS[which]
    const activePosition = { x: uv.x, y: 1 - uv.y }
    const selectedWords = state.selectedWords.concat(activeWord)
    const selectedPositions = state.selectedPositions.concat(activePosition)
    const phraseSequence = spacePhrase(
      parsePhrase([activeWord], false, MOUTH_FRAMES_SHAPE_MAP))

    Object.assign(state, {
      activeWord,
      activePosition,
      selectedWords,
      selectedPositions,
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
    const { state } = this
    const { components, entities } = this.context
    const { dinild } = entities
    const { phraseMap } = components
    if (!dinild) return

    // FIXME maybe
    if (!this.hasBoundPhrase) {
      this.bindPhrase(dinild.phrase)
    }

    dinild.phrase.setSequence(state.phraseSequence)
    phraseMap.setPositions(state.selectedPositions)
  }
})
