// TODO: Create generic consonant frame
export const MOUTH_FRAMES = [
  '_', // Create blank frame
  'AI',
  'LND', // Probably add unique frames for N, D
  'E',
  'O',
  'U',
  'WQ',
  'MBP',
  'FV'
]

export const MOUTH_FRAMES_MAP = MOUTH_FRAMES
  .reduce((map, v, i) => {
    map[v] = i
    return map
  }, {})

export const MOUTH_FRAMES_CHAR_MAP = expandFrameKeys(MOUTH_FRAMES)

function expandFrameKeys (frames) {
  const expanded = {}
  frames.forEach((key, index) => {
    key.split('').forEach((char) => {
      expanded[char] = index
    })
  })
  return expanded
}
