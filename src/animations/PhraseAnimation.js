import { MOUTH_FRAMES_SHAPE_MAP } from '../constants/animation'
import { inherit } from '../utils/ctor'
import { clamp } from '../utils/math'

// TODO: Add easings to tween utils
// function easeInOut (k) {
//   if ((k *= 2) < 1) return 0.5 * k * k
//   return -0.5 * (--k * (k - 2) - 1)
// }

export function PhraseAnimation () {
  this.sequence = null
  this.frame = 0
  this.progress = this.createProgress()
  this.state = this.createState()
  this.statePrev = this.createState()
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
  createState () {
    return {
      indexWord: 0,
      indexSyllable: 0,
      indexShape: 0,
      frameShape: 0,
      weightShape: 0
    }
  },

  createProgress () {
    return {
      word: 0,
      syllable: 0,
      shape: 0
    }
  },

  update () {
    const { sequence, progress, state, statePrev } = this
    if (!sequence) return

    const { duration, loop, words } = sequence
    const indexWordPrev = state.indexWord
    const indexSyllablePrev = state.indexSyllable
    const indexShapePrev = state.indexShape
    const frameShapePrev = state.frameShape
    const weightShapePrev = state.weightShape

    let frame = this.frame++
    if (frame > duration - 1) {
      if (!loop) return
      frame = this.frame = 0
      state.indexWord = 0
      state.indexSyllable = 0
      state.indexShape = 0
    }

    let word = words[state.indexWord]
    if (frame > word.start + word.duration - 1) {
      word = words[++state.indexWord]
      state.indexSyllable = 0
      state.indexShape = 0
    }

    let syllable = word.syllables[state.indexSyllable]
    if (frame > word.start + syllable.start + syllable.duration - 1) {
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

    state.indexShape = indexShape
    state.frameShape = shapeFrames[indexShape]
    state.weightShape = syllable.weight

    if (state.indexWord !== indexWordPrev) {
      statePrev.indexWord = indexWordPrev
    }

    if (state.indexSyllable !== indexSyllablePrev) {
      statePrev.indexSyllable = indexSyllablePrev
    }

    if (indexShape !== indexShapePrev) {
      statePrev.indexShape = indexShapePrev
      statePrev.frameShape = frameShapePrev
      statePrev.weightShape = weightShapePrev
    }
  },

  applyToWeights (weights) {
    const { progress, state, statePrev } = this
    const shapeProgress = clamp(0, 1, progress.shape)
    const weightPrev = statePrev.weightShape
    const weightNext = state.weightShape
    const framePrev = statePrev.frameShape
    const frameNext = state.frameShape

    weights[framePrev] += (1 - shapeProgress) * weightPrev
    weights[frameNext] += shapeProgress * weightNext
  }
})

function mapShapeToFrames (shape, frames) {
  return shape.split('-').map((sound) => frames[sound] || 0)
}

function mapStart (item, index, list) {
  const prev = index === 0 ? null : list[index - 1]
  item.start = !prev ? 0 : prev.start + prev.duration
  return item
}
