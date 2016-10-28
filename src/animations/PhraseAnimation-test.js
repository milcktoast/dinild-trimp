import test from 'tape'
import { PhraseAnimation } from './PhraseAnimation'

const WORDS = [{
  name: 'dude',
  syllables: [{
    duration: 3,
    shape: 'D,U',
    weight: 1
  }, {
    duration: 2,
    shape: 'D,E',
    weight: 0.5
  }]
}, {
  name: 'nope',
  syllables: [{
    duration: 20,
    shape: 'N,O',
    weight: 1
  }, {
    duration: 15,
    shape: 'P,E',
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
  const word = PhraseAnimation.parseWord(data, SHAPE_MAP)
  const expectedSyllables = [{
    start: 0,
    duration: 3,
    shapeFrames: [0, 1],
    step: 1 / 3,
    weight: 1
  }, {
    start: 3,
    duration: 2,
    shapeFrames: [0, 2],
    step: 1 / 2,
    weight: 0.5
  }]
  t.plan(3)
  t.equal(word.name, data.name,
    'should preserve name')
  t.equal(word.duration, 5,
    'should calculate total duration')
  t.deepEqual(word.syllables, expectedSyllables,
    'should parse syllables')
})

test('PhraseAnimation - parse phrase', (t) => {
  const words = [WORDS[0], WORDS[0], WORDS[0]]
  const phrase = PhraseAnimation.parsePhrase(words, true, SHAPE_MAP)
  const wordStarts = phrase.words.map((item) => item.start)
  t.plan(3)
  t.equal(phrase.loop, true,
    'should set loop prop')
  t.deepEqual(wordStarts, [0, 5, 10],
    'should calculate word start frames')
  t.equal(phrase.duration, 15,
    'should calculate total duration')
})

test('PhraseAnimation - step words', (t) => {
  const words = [WORDS[0], WORDS[0], WORDS[0]]
  const phrase = PhraseAnimation.parsePhrase(words, true, SHAPE_MAP)
  const anim = new PhraseAnimation()
  const animTick = createTick(anim, 'update')

  anim.phrase = phrase
  t.plan(18)

  animTick(3)
  t.deepEqual(anim.phraseStatePrev, phraseState(0, 0, 0),
    'should update phraseStatePrev at 3 frames')
  t.deepEqual(anim.phraseState, phraseState(0, 0, 1),
    'should update phraseState at 3 frames')

  animTick(4)
  t.deepEqual(anim.phraseStatePrev, phraseState(0, 0, 0),
    'should update phraseStatePrev at 4 frames')
  t.deepEqual(anim.phraseState, phraseState(0, 1, 0),
    'should update phraseState at 4 frames')

  animTick(5)
  t.deepEqual(anim.phraseStatePrev, phraseState(0, 0, 0),
    'should update phraseStatePrev at 5 frames')
  t.deepEqual(anim.phraseState, phraseState(0, 1, 1),
    'should update phraseState at 5 frames')

  animTick(6)
  t.deepEqual(anim.phraseStatePrev, phraseState(0, 1, 0),
    'should update phraseStatePrev at 6 frames')
  t.deepEqual(anim.phraseState, phraseState(1, 0, 0),
    'should update phraseState at 6 frames')

  animTick(9)
  t.deepEqual(anim.phraseStatePrev, phraseState(1, 0, 0),
    'should update phraseStatePrev at 9 frames')
  t.deepEqual(anim.phraseState, phraseState(1, 1, 0),
    'should update phraseState at 9 frames')

  animTick(11)
  t.deepEqual(anim.phraseStatePrev, phraseState(1, 1, 0),
    'should update phraseStatePrev at 11 frames')
  t.deepEqual(anim.phraseState, phraseState(2, 0, 0),
    'should update phraseState at 11 frames')

  animTick(14)
  t.deepEqual(anim.phraseStatePrev, phraseState(2, 0, 0),
    'should update phraseStatePrev at 14 frames')
  t.deepEqual(anim.phraseState, phraseState(2, 1, 0),
    'should update phraseState at 14 frames')

  animTick(15)
  t.deepEqual(anim.phraseStatePrev, phraseState(2, 0, 0),
    'should update phraseStatePrev at 15 frames')
  t.deepEqual(anim.phraseState, phraseState(2, 1, 1),
    'should update phraseState at 15 frames')

  animTick(16)
  t.deepEqual(anim.phraseStatePrev, phraseState(0, 0, 0),
    'should update phraseStatePrev at 16 frames and loop')
  t.deepEqual(anim.phraseState, phraseState(0, 0, 0),
    'should update phraseState at 16 frames and loop')
})

test('PhraseAnimation - weight shapes', (t) => {
  const words = [WORDS[1]]
  const phrase = PhraseAnimation.parsePhrase(words, false, SHAPE_MAP)
  const anim = new PhraseAnimation()
  const animTick = createTick(anim, 'update')

  anim.phrase = phrase
  animTick(5)
  t.equal()
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

function phraseState (indexWord = 0, indexSyllable = 0, indexShape = 0) {
  return {
    indexWord, indexSyllable, indexShape
  }
}
