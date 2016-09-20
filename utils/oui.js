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
    prev && state[key]
  ))
}

addAnnotator(annotatePointLight, 'intensity', 'distance')
const annotatePointLightPosition = annotatePosition(16, 16, 16)
function annotatePointLight ({ position, color, intensity, distance }) {
  return {
    position: annotatePointLightPosition(position),
    @colorPicker
    color,
    @lightIntensity
    intensity,
    @annotate({ min: distance - 40, max: distance + 40, step: 0.5 })
    distance
  }
}

addAnnotator(annotateHemiLight, 'skyColor', 'groundColor')
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

function annotatePosition (rangeX, rangeY, rangeZ) {
  return ({ x, y, z }) => {
    return {
      @annotate({ min: x - rangeX, max: x + rangeX, step: 0.5 })
      x,
      @annotate({ min: y - rangeY, max: y + rangeY, step: 0.5 })
      y,
      @annotate({ min: z - rangeZ, max: z + rangeZ, step: 0.5 })
      z
    }
  }
}
