import { WORDS } from '../constants/phrase'
import { MOUTH_FRAMES_CHAR_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'

export function IndexPhraseState (context) {
  this.context = context
  this.state = this.createState()
  this.bindEvents(context)
}

inherit(null, IndexPhraseState, {
  createState () {
    return {
      phrase: null,
      words: []
    }
  },

  bindEvents (context) {
    const { selection } = context.camera
    selection.addEventListener('add', this.onSelectionAdd.bind(this))
  },

  onSelectionAdd (event) {
    const { state } = this
    const { words } = state
    const { which } = event

    const nextWords = words.concat(WORDS[which])
    const chars = nextWords.join('_').toUpperCase()
    const charFrames = mapCharsToFrames(chars, MOUTH_FRAMES_CHAR_MAP)

    state.words = nextWords
    state.phrase = {
      loop: false,
      frame: 0,
      framesPerChar: 12,
      chars,
      charFrames
    }

    this.syncState()
  },

  syncState () {
    this.updateState(this.state)
  },

  updateState (nextState) {
    const { dinild } = this.context.entities
    if (!dinild) return
    dinild.phrase = this.state.phrase
  }
})

function mapCharsToFrames (chars, frames) {
  return chars.split('').map((letter) => frames[letter] || 0)
}
