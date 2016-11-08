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
      phraseSequence: null,
      phraseSpacing: {
        min: 10,
        max: 60,
        start: 20,
        end: 40
      }
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
    const phraseSequence = spacePhrase(state.phraseSpacing,
      parsePhrase([activeWord], false, MOUTH_FRAMES_SHAPE_MAP))

    Object.assign(state, {
      enableSelection: false,
      activeWord,
      activePosition,
      selectedWords,
      selectedPositions,
      phraseSequence,
      phraseMaxWords: null
    })
    this.syncState()
  },

  onSequenceStart (event) {
    Object.assign(this.state, {
      enableSelection: false,
      phraseMaxWords: null
    })
    this.syncState()
  },

  onSequenceEnd (event) {
    Object.assign(this.state, {
      enableSelection: true,
      phraseMaxWords: null
    })
    this.syncState()
  },

  onSequenceActivate (event) {
    const { state } = this
    const phraseSequence = spacePhrase(state.phraseSpacing,
      parsePhrase(state.selectedWords, true, MOUTH_FRAMES_SHAPE_MAP))

    Object.assign(state, {
      enableSelection: false,
      phraseSequence,
      phraseMaxWords: null
    })
    this.syncState()
  },

  onSequenceDeactivate (event) {
    const { state } = this

    Object.assign(state, {
      phraseMaxWords: 1
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
    dinild.phrase.trimSequenceDuration(state.phraseMaxWords, false)
  }
})
