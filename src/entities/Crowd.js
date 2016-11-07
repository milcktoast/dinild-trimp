import { readFileSync } from 'fs'
import { resolve } from 'path'

import { inherit } from '../utils/ctor'
import { memoizeAll } from '../utils/function'
import { loadAudioSprite } from '../utils/audio-load'
import { easeCubicIn, factorTween } from '../utils/tween'

const BACKGROUND_META = JSON.parse(
  readFileSync(resolve(__dirname, '../../assets/audio_sprite/background.json'), 'utf8'))

export function Crowd (params = {}) {
  this.volume = params.volume || 0
  this.state = {
    volume: this.volume
  }
  this.createAudio()
}

Object.assign(Crowd, memoizeAll({
  preload () {
    Crowd.loadAudio()
    return Promise.resolve()
  },

  load () {
    return Crowd.loadAudio()
  },

  loadAudio () {
    return loadAudioSprite(BACKGROUND_META)
  }
}))

inherit(null, Crowd, {
  createAudio () {
    return Crowd.loadAudio().then((background) => {
      background.volume(this.state.volume)
      this.audio = background
    })
  },

  playAudio () {
    this.audio.play('crowd')
    this.volume = 1
  },

  update () {
    const { audio } = this
    if (!audio) return

    const volume = easeCubicIn(
      factorTween('volume', this.state, this, 0.005))
    audio.volume(volume * 0.6)
  }
})
