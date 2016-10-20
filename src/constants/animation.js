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
