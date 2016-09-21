import {
  annotate,
  controls,
  panel
} from 'ouioui'

export function createStateControls (config) {
  return panel(config)
}

const ANNOTATORS = []
function addAnnotator (fn, ...keys) {
  ANNOTATORS.push({
    keys, fn
  })
}

function setupAnnotators () {
  addAnnotator(annotateHemiLight, 'skyColor', 'groundColor')
  addAnnotator(annotateSpotLight, 'angle', 'penumbra')
  addAnnotator(annotatePointLight, 'intensity', 'distance')
  addAnnotator(annotateCamera, 'position', 'target', 'up')
  addAnnotator(annotateVector, 'x', 'y', 'z')
}

export function annotateState (state) {
  if (!ANNOTATORS.length) setupAnnotators()
  Object.keys(state).forEach((key) => {
    const value = state[key]
    const annotator = ANNOTATORS.find((item) => (
      hasProps(value, item.keys)
    ))
    if (annotator) {
      state[key] = annotator.fn(value)
    }
  })
  return state
}

function hasProps (state, keys) {
  return keys.reduce((prev, key) => (
    prev && state[key] != null
  ))
}

const colorPicker = annotate({
  control: controls.ColorPicker
})
const lightIntensity = annotate({
  min: 0,
  max: 4,
  step: 0.1
})

function annotateVector ({ x, y, z }, range = 40) {
  const rangeX = annotate({ min: x - range, max: x + range, step: 0.5 })
  const rangeY = annotate({ min: y - range, max: y + range, step: 0.5 })
  const rangeZ = annotate({ min: z - range, max: z + range, step: 0.5 })
  return {
    @rangeX x,
    @rangeY y,
    @rangeZ z
  }
}

function annotateCamera ({
  position, target, up, reset
}) {
  return {
    position: annotateVector(position),
    target: annotateVector(target),
    up: annotateVector(up),
    reset
  }
}

function annotatePointLight ({
  position, color, intensity, distance
}) {
  const distanceRange = annotate({ min: distance - 40, max: distance + 40, step: 0.5 })
  return {
    position: annotateVector(position),
    @colorPicker color,
    @lightIntensity intensity,
    @distanceRange distance
  }
}

function annotateSpotLight ({
  position, target, helper, castShadow,
  color, intensity, distance,
  angle, penumbra, decay
}) {
  const distanceRange = annotate({ min: distance - 40, max: distance + 40, step: 0.5 })
  const angleRange = annotate({ min: 0, max: Math.PI, step: Math.PI / 180 })
  const penumbraRange = annotate({ min: 0, max: 1, step: 0.05 })
  const decayRange = annotate({ min: 0, max: 3, step: 0.05 })
  return {
    position: annotateVector(position),
    target: annotateVector(target),
    helper: helper || false,
    castShadow: castShadow || false,
    @colorPicker color,
    @lightIntensity intensity,
    @distanceRange distance,
    @angleRange angle,
    @penumbraRange penumbra,
    @decayRange decay
  }
}

function annotateHemiLight ({ skyColor, groundColor, intensity }) {
  return {
    @colorPicker skyColor,
    @colorPicker groundColor,
    @lightIntensity intensity
  }
}
