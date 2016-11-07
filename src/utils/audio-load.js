import { Howl } from 'howler'

export function loadAudioSprite (meta) {
  return new Promise((resolve, reject) => {
    const howl = new Howl({
      src: meta.urls,
      sprite: offsetSpriteLoops(meta.sprite, 200),
      onload: () => resolve(howl),
      onloaderror: reject
    })
  })
}

// FIXME
function offsetSpriteLoops (sprite, offset) {
  Object.keys(sprite).forEach((key) => {
    const data = sprite[key]
    const loop = data[2]
    if (loop) {
      data[0] = offset
      data[1] = Math.round(data[1] - offset)
    }
  })
  return sprite
}
