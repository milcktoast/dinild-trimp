import { WORDS } from '../constants/phrase'
import { MOUTH_FRAMES_SHAPE_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'
import {
  parsePhrase,
  spacePhrase
} from '../animations/PhraseAnimation'

const DEBUG_WORD = null

export function IndexPhraseState (context) {
  this.context = context
  this.state = this.createState()
  this.bindEvents(context)
}

inherit(null, IndexPhraseState, {
  createState () {
    return {
      enableSelection: true,
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

  bindPhrase (phrase, phraseMap) {
    phrase.addEventListener('sequenceStart', this.onSequenceStart.bind(this))
    phrase.addEventListener('sequenceEnd', this.onSequenceEnd.bind(this))
    phraseMap.addEventListener('activate', this.onSequenceActivate.bind(this))
    phraseMap.addEventListener('deactivate', this.onSequenceDeactivate.bind(this))
    this.hasBoundPhrase = true
  },

  onSelectionAdd (event) {
    const { state } = this
    const { uv, which } = event

    const activeWord = DEBUG_WORD != null
      ? WORDS.find((word) => word.name === DEBUG_WORD)
      : WORDS[which]
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

    if (DEBUG_WORD) {
      window.__ACTIVE_WORD__ = activeWord
    }

    this.syncState()
  },

  onSequenceStart (event) {
    this.state.enableSelection = false
    this.syncState()
  },

  onSequenceEnd (event) {
    this.state.enableSelection = true
    this.syncState()
  },

  onSequenceActivate (event) {
    const { state } = this
    const phraseSequence = spacePhrase(
      parsePhrase(state.selectedWords, true, MOUTH_FRAMES_SHAPE_MAP))

    Object.assign(state, {
      enableSelection: false,
      phraseSequence
    })

    this.syncState()
  },

  onSequenceDeactivate (event) {
    const { state } = this
    const { phraseSequence } = state

    phraseSequence.loop = false
    Object.assign(state, {
      phraseSequence
    })

    this.syncState()
  },

  syncState () {
    this.updateState(this.state)
  },

  updateState (nextState) {
    const { state } = this
    const { camera, components, entities } = this.context
    const { dinild } = entities
    const { phraseMap } = components
    if (!dinild) return

    // FIXME maybe
    if (!this.hasBoundPhrase) {
      this.bindPhrase(dinild.phrase, phraseMap)
    }

    camera.controls.enableCursor = state.enableSelection
    phraseMap.positions = state.selectedPositions
    dinild.phrase.setSequence(state.phraseSequence)
  }
})
