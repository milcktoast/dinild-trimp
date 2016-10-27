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
      phrase: {
        frame: 0,
        framesPerLetter: 12,
        chars: null,
        charFrames: null
      },
      words: []
    }
  },

  bindEvents (context) {
    const { selection } = context.camera
    selection.addEventListener('add', this.onSelectionAdd.bind(this))
  },

  onSelectionAdd (event) {
    const { state } = this
    const { phrase, words } = state
    const { which } = event

    const nextWords = words.concat(WORDS[which])
    const chars = nextWords.join('_').toUpperCase()
    const charFrames = mapCharsToFrames(chars, MOUTH_FRAMES_CHAR_MAP)

    state.words = nextWords
    phrase.frame = 0
    phrase.chars = chars
    phrase.charFrames = charFrames

    this.syncState()
  },

  syncState () {
    this.updateState(this.state)
  },

  updateState (nextState) {
    console.log(nextState)
  }
})

function mapCharsToFrames (chars, frames) {
  return chars.split('').map((letter) => frames[letter])
}
