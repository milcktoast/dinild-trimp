import test from 'tape'
import {
  parseWord,
  parsePhrase,
  spacePhrase,
  PhraseAnimation
} from './PhraseAnimation'

const WORDS = [{
  name: 'dude',
  syllables: [{
    duration: 4,
    shape: 'D-U',
    weight: 1
  }, {
    duration: 2,
    shape: 'D-E',
    weight: 0.5
  }]
}, {
  name: 'nope',
  syllables: [{
    duration: 20,
    shape: 'N-O',
    weight: 1
  }, {
    duration: 15,
    shape: 'P-E',
    weight: 0.5
  }]
}]
const SHAPE_MAP = {
  'D': 0,
  'U': 1,
  'E': 2,
  'N': 3,
  'O': 4,
  'P': 5
}

test('PhraseAnimation - parse word', (t) => {
  const data = WORDS[0]
  const word = parseWord(data, SHAPE_MAP)
  const expectedSyllables = [{
    start: 0,
    duration: 4,
    shapeFrames: [0, 1],
    weight: 1
  }, {
    start: 4,
    duration: 2,
    shapeFrames: [0, 2],
    weight: 0.5
  }]
  t.plan(3)
  t.equal(word.name, data.name,
    'should preserve name')
  t.equal(word.duration, 6,
    'should calculate total duration')
  t.deepEqual(word.syllables, expectedSyllables,
    'should parse syllables')
})

test('PhraseAnimation - parse phrase', (t) => {
  const words = [WORDS[0], WORDS[0], WORDS[0]]
  const phrase = parsePhrase(words, true, SHAPE_MAP)
  const wordStarts = phrase.words.map((item) => item.start)
  t.plan(3)
  t.equal(phrase.loop, true,
    'should set loop prop')
  t.deepEqual(wordStarts, [0, 6, 12],
    'should calculate word start frames')
  t.equal(phrase.duration, 18,
    'should calculate total duration')
})

test('PhraseAnimation - inject spacer words', (t) => {
  const words = [WORDS[0], WORDS[0], WORDS[0]]
  const phrase = parsePhrase(words, true, SHAPE_MAP)
  const spaceParams = { min: 10, max: 20, start: 10, end: 10 }
  const spaced = spacePhrase(spaceParams, phrase)
  t.plan(4)
  t.equal(spaced.loop, phrase.loop,
    'should copy loop prop')
  t.notEqual(spaced.duration, phrase.duration,
    'should update duration prop')
  t.deepEqual([spaced.words[1], spaced.words[3], spaced.words[5]], phrase.words,
    'should equally space phrase words')
  t.equal(spaced.words.length, words.length * 2 + 1,
    'should space words throughout')
})

test('PhraseAnimation - update state', (t) => {
  const words = [WORDS[0], WORDS[0], WORDS[0]]
  const phrase = parsePhrase(words, true, SHAPE_MAP)
  const anim = new PhraseAnimation()
  const animTick = createTick(anim, 'update')
  const phraseState = createPhraseState(words)

  anim.setSequence(phrase)

  animTick(3)
  t.deepEqual(anim.statePrev, phraseState(0, 0, 0, 0, 1),
    'should update statePrev at 3 iterations')
  t.deepEqual(anim.state, phraseState(0, 0, 1, 1, 1),
    'should update state at 3 iterations')

  animTick(4)
  t.deepEqual(anim.statePrev, phraseState(0, 0, 0, 0, 1),
    'should update statePrev at 4 iterations')
  t.deepEqual(anim.state, phraseState(0, 0, 1, 1, 1),
    'should update state at 4 iterations')

  animTick(5)
  t.deepEqual(anim.statePrev, phraseState(0, 0, 1, 1, 1),
    'should update statePrev at 5 iterations')
  t.deepEqual(anim.state, phraseState(0, 1, 0, 0, 0.5),
    'should update state at 5 iterations')

  animTick(11)
  t.deepEqual(anim.statePrev, phraseState(0, 0, 1, 1, 1),
    'should update statePrev at 11 iterations')
  t.deepEqual(anim.state, phraseState(1, 1, 0, 0, 0.5),
    'should update state at 11 iterations')

  animTick(12)
  t.deepEqual(anim.statePrev, phraseState(0, 0, 0, 0, 0.5),
    'should update statePrev at 12 iterations')
  t.deepEqual(anim.state, phraseState(1, 1, 1, 2, 0.5),
    'should update state at 12 iterations')

  animTick(13)
  t.deepEqual(anim.statePrev, phraseState(1, 1, 1, 2, 0.5),
    'should update statePrev at 13 iterations')
  t.deepEqual(anim.state, phraseState(2, 0, 0, 0, 1),
    'should update state at 13 iterations')

  animTick(18)
  t.deepEqual(anim.statePrev, phraseState(1, 0, 0, 0, 0.5),
    'should update statePrev at 18 iterations')
  t.deepEqual(anim.state, phraseState(2, 1, 1, 2, 0.5),
    'should update state at 18 iterations')

  animTick(19)
  t.deepEqual(anim.statePrev, phraseState(2, 1, 1, 2, 0.5),
    'should update statePrev at 19 iterations and loop')
  t.deepEqual(anim.state, phraseState(0, 0, 0, 0, 1),
    'should update state at 19 iterations and loop')

  animTick(20)
  t.deepEqual(anim.statePrev, phraseState(2, 1, 1, 2, 0.5),
    'should update statePrev at 20 iterations and continue loop')
  t.deepEqual(anim.state, phraseState(0, 0, 0, 0, 1),
    'should update state at 20 iterations and continue loop')

  animTick(22)
  t.deepEqual(anim.statePrev, phraseState(0, 0, 0, 0, 1),
    'should update statePrev at 22 iterations and continue loop')
  t.deepEqual(anim.state, phraseState(0, 0, 1, 1, 1),
    'should update state at 22 iterations and continue loop')

  animTick(31)
  t.deepEqual(anim.statePrev, phraseState(1, 1, 1, 2, 0.5),
    'should update statePrev at 31 iterations')
  t.deepEqual(anim.state, phraseState(2, 0, 0, 0, 1),
    'should update state at 31 iterations')

  t.end()
})

test('PhraseAnimation - update progress', (t) => {
  const words = [WORDS[1]]
  const phrase = parsePhrase(words, false, SHAPE_MAP)
  const anim = new PhraseAnimation()
  const animTick = createTick(anim, 'update')

  anim.setSequence(phrase)

  animTick(10)
  t.deepEqual(anim.progress, phraseProgress(9 / 34, 9 / 19, 9 / 9),
    'should update progress at 10 iterations')

  animTick(20)
  t.deepEqual(anim.progress, phraseProgress(19 / 34, 19 / 19, 9 / 9),
    'should update progress at 20 iterations')

  animTick(21)
  t.deepEqual(anim.progress, phraseProgress(20 / 34, 0 / 14, 0 / 6.5),
    'should update progress at 21 iterations')

  animTick(30)
  t.deepEqual(anim.progress, phraseProgress(29 / 34, 9 / 14, 2 / 6.5),
    'should update progress at 30 iterations')

  animTick(35)
  t.deepEqual(anim.progress, phraseProgress(34 / 34, 14 / 14, 7 / 6.5),
    'should update progress at 35 iterations')

  t.end()
})

test('PhraseAnimation - apply shape weights', (t) => {
  const words = [WORDS[1]]
  const phrase = parsePhrase(words, false, SHAPE_MAP)
  const anim = new PhraseAnimation()
  const weights = createWeights(6)
  const animTick = createTick(anim, 'update')

  anim.setSequence(phrase)

  animTick(10)
  resetWeights(weights)
  anim.applyToWeights(weights)
  t.deepEqual(weights, [0, 0, 0, 1, 0, 0],
    'should apply weights for 10 iterations')

  animTick(15)
  resetWeights(weights)
  anim.applyToWeights(weights)
  t.deepEqual(weights, [0, 0, 0, 1 - 4 / 9, 4 / 9, 0],
    'should apply weights for 15 iterations')

  animTick(20)
  resetWeights(weights)
  anim.applyToWeights(weights)
  t.deepEqual(weights, [0, 0, 0, 0, 1, 0],
    'should apply weights for 20 iterations')

  animTick(30)
  resetWeights(weights)
  anim.applyToWeights(weights)
  t.deepEqual(weights, [0, 0, (2 / 6.5) * 0.5, 0, 0, (1 - 2 / 6.5) * 0.5],
    'should apply weights for 30 iterations')

  animTick(35)
  resetWeights(weights)
  anim.applyToWeights(weights)
  t.deepEqual(weights, [0, 0, 1 * 0.5, 0, 0, 0],
    'should apply weights for 35 iterations')

  t.end()
})

function createTick (context, fn) {
  let frame = 0
  return (toFrame, ...args) => {
    const diff = toFrame - frame
    for (let i = 0; i < diff; i++) {
      context[fn].apply(context, args)
    }
    frame += diff
  }
}

function createWeights (count) {
  const weights = []
  for (let i = 0; i < count; i++) {
    weights[i] = 0
  }
  return weights
}

function resetWeights (weights) {
  for (let i = 0; i < weights.length; i++) {
    weights[i] = 0
  }
}

function createPhraseState (words) {
  return (indexWord, indexSyllable, indexShape, frameShape, weightShape) => {
    return {
      indexWord, indexSyllable, indexShape, frameShape, weightShape
    }
  }
}

function phraseProgress (word, syllable, shape) {
  return {
    word, syllable, shape
  }
}
