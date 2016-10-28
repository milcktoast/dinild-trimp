import { MOUTH_FRAMES_SHAPE_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'

export function PhraseAnimation () {
  this.phrase = null
  this.frame = 0
  this.progress = {
    word: 0,
    syllable: 0,
    shape: 0
  }
  this.state = {
    indexWord: 0,
    indexSyllable: 0,
    indexShape: 0
  }
  this.statePrev = {
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
        return {
          duration,
          shapeFrames,
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
    const { phrase, progress, state, statePrev } = this
    if (!phrase) return

    const { duration, loop, words } = phrase
    const indexShapePrev = state.indexShape

    let frame = this.frame++
    if (frame > duration - 1) {
      if (!loop) return
      frame = this.frame = 0
      Object.assign(statePrev, state)
      state.indexWord = 0
      state.indexSyllable = 0
      state.indexShape = 0
    }

    let word = words[state.indexWord]
    if (frame > word.start + word.duration - 1) {
      Object.assign(statePrev, state)
      word = words[++state.indexWord]
      state.indexSyllable = 0
      state.indexShape = 0
    }

    let syllable = word.syllables[state.indexSyllable]
    if (frame > word.start + syllable.start + syllable.duration - 1) {
      Object.assign(statePrev, state)
      syllable = word.syllables[++state.indexSyllable]
      state.indexShape = 0
    }

    const { shapeFrames } = syllable
    const wordStart = word.start
    const syllableStart = wordStart + syllable.start

    const wordProgress = (frame - wordStart) / (word.duration - 1)
    const syllableProgress = (frame - syllableStart) / (syllable.duration - 1)

    const indexShape = Math.round(syllableProgress * (shapeFrames.length - 1))
    const shapeDuration = syllable.duration / shapeFrames.length
    const shapeStart = syllableStart + Math.floor(indexShape * shapeDuration)
    const shapeProgress = (frame - shapeStart) / (shapeDuration - 1)

    progress.word = wordProgress
    progress.syllable = syllableProgress
    progress.shape = shapeProgress

    statePrev.indexShape = indexShapePrev
    state.indexShape = indexShape
  },

  getShape (phrase, state) {
    const { indexWord, indexSyllable, indexShape } = state
    return phrase.words[indexWord].syllables[indexSyllable].shapeFrames[indexShape]
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
