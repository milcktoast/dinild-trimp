// TODO: Create generic consonant frame
export const MOUTH_FRAMES = [
  '_', // Create blank frame
  'A-I',
  'L-N-D-T', // Probably add frames for N, D, T
  'EE',
  'CH-S', // Add frame for CH
  'O-R', // Add frame for R
  'OO-U',
  'W-Q',
  'M-B-P',
  'F-V'
]

export const MOUTH_FRAMES_MAP = MOUTH_FRAMES
  .reduce((map, v, i) => {
    map[v] = i
    return map
  }, {})

export const MOUTH_FRAMES_SHAPE_MAP = expandFrameKeys(MOUTH_FRAMES)

function expandFrameKeys (frames) {
  const expanded = {}
  frames.forEach((key, index) => {
    key.split('-').forEach((char) => {
      expanded[char] = index
    })
  })
  return expanded
}
