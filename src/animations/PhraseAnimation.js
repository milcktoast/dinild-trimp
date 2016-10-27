import { MOUTH_FRAMES_SHAPE_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'

export function PhraseAnimation () {
  this.phrase = null
  this.frame = 0
  this.phraseState = {
    indexWord: 0,
    indexSyllable: 0,
    indexShape: 0
  }
  this.phraseStatePrev = {
    indexWord: 0,
    indexSyllable: 0,
    indexShape: 0
  }
}

Object.assign(PhraseAnimation, {
  parseWord (word, shapeMap_) {
    const shapeMap = shapeMap_ || MOUTH_FRAMES_SHAPE_MAP
    const syllables = word.syllables
      .map((syllable) => {
        const { duration, shape, weight } = syllable
        const shapeFrames = mapShapeToFrames(shape, shapeMap)
        const step = (shapeFrames.length - 1) / duration
        return {
          duration,
          shapeFrames,
          step,
          weight
        }
      })
      .map(mapStart)
    const duration = syllables
      .reduce((total, syllable) => total + syllable.duration, 0)

    return {
      duration,
      name: word.name,
      syllables
    }
  },

  parsePhrase (words, loop, shapeMap) {
    const phraseWords = words
      .map((word) => PhraseAnimation.parseWord(word, shapeMap))
      .map(mapStart)
    const duration = phraseWords
      .reduce((total, word) => total + word.duration, 0)

    return {
      duration,
      loop,
      words: phraseWords
    }
  }
})

inherit(null, PhraseAnimation, {
  update () {
    const { phrase, phraseState, phraseStatePrev } = this
    if (!phrase) return

    const { duration, loop, words } = phrase

    let frame = this.frame++
    if (frame > duration) {
      if (loop) {
        frame = this.frame = 0
        phraseState.indexWord = phraseState.indexWordNext = 0
        phraseState.indexSyllable = phraseState.indexSyllableNext = 0
        phraseState.indexShape = phraseState.indexShapeNext = 0
      } else {
        return
      }
    }

    let word = words[phraseState.indexWord]
    if (frame > word.start + word.duration - 1) {
      Object.assign(phraseStatePrev, phraseState)
      word = words[++phraseState.indexWord]
      phraseState.indexSyllable = 0
      phraseState.indexShape = 0
    }

    let syllable = word.syllables[phraseState.indexSyllable]
    if (frame > word.start + syllable.start + syllable.duration - 1) {
      Object.assign(phraseStatePrev, phraseState)
      syllable = word.syllables[++phraseState.indexSyllable]
      phraseState.indexShape = 0
    }

    const { shapeFrames, step } = syllable
    const syllableStart = word.start + syllable.start
    const syllableProgress = (frame - syllableStart) * step

    phraseStatePrev.indexShape = phraseState.indexShape
    phraseState.indexShape = Math.floor(syllableProgress * shapeFrames.length)
  },

  // TODO: Apply phrase state to pose weights
  applyToWeights (weights) {}
})

function mapShapeToFrames (shape, frames) {
  return shape.split(',').map((sound) => frames[sound] || 0)
}

function mapStart (item, index, list) {
  const prev = index === 0 ? null : list[index - 1]
  item.start = !prev ? 0 : prev.start + prev.duration
  return item
}
