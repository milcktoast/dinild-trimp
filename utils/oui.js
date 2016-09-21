import {
  annotate,
  controls,
  oui
} from 'ouioui'

export function createStateControls (state, update) {
  return oui(annotateState(state), update)
}

const colorPicker = annotate({
  control: controls.ColorPicker
})
const lightIntensity = annotate({
  min: 0,
  max: 4,
  step: 0.1
})

const ANNOTATORS = []
function addAnnotator (fn, ...keys) {
  ANNOTATORS.push({
    keys, fn
  })
}

addAnnotator(annotateHemiLight, 'skyColor', 'groundColor')
addAnnotator(annotateSpotLight, 'angle', 'penumbra')
addAnnotator(annotatePointLight, 'intensity', 'distance')

function annotateState (state) {
  return Object.keys(state)
    .reduce((annotatedState, key) => {
      const value = state[key]
      const annotator = ANNOTATORS.find((item) => (
        hasProps(value, item.keys)
      ))
      annotateState[key] = annotator
        ? annotator.fn(value)
        : value
      return annotateState
    }, {})
}

function hasProps (state, keys) {
  return keys.reduce((prev, key) => (
    prev && state[key] != null
  ))
}

function annotatePosition (range, { x, y, z }) {
  return {
    @annotate({ min: x - range, max: x + range, step: 0.5 })
    x,
    @annotate({ min: y - range, max: y + range, step: 0.5 })
    y,
    @annotate({ min: z - range, max: z + range, step: 0.5 })
    z
  }
}

function annotatePointLight ({
  position, color, intensity, distance
}) {
  return {
    position: annotatePosition(20, position),
    @colorPicker
    color,
    @lightIntensity
    intensity,
    @annotate({ min: distance - 40, max: distance + 40, step: 0.5 })
    distance
  }
}

function annotateSpotLight ({
  position, target, helper, castShadow,
  color, intensity, distance,
  angle, penumbra, decay
}) {
  return {
    position: annotatePosition(20, position),
    target: annotatePosition(20, target),
    helper: helper || false,
    castShadow: castShadow || false,
    @colorPicker
    color,
    @lightIntensity
    intensity,
    @annotate({ min: distance - 40, max: distance + 40, step: 0.5 })
    distance,
    @annotate({ min: 0, max: Math.PI, step: Math.PI / 180 })
    angle,
    @annotate({ min: 0, max: 1, step: 0.05 })
    penumbra,
    @annotate({ min: 0, max: 3, step: 0.05 })
    decay
  }
}

function annotateHemiLight ({ skyColor, groundColor, intensity }) {
  return {
    @colorPicker
    skyColor,
    @colorPicker
    groundColor,
    @lightIntensity
    intensity
  }
}
