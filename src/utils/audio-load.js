import { Howl } from 'howler'

export function loadAudioSprite (meta) {
  return new Promise((resolve, reject) => {
    const howl = new Howl({
      src: meta.urls,
      sprite: meta.sprite,
      onload: () => resolve(howl),
      onloaderror: reject
    })
  })
}
