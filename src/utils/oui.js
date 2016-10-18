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
  addAnnotator(annotateFog, 'color', 'near', 'far')
  addAnnotator(annotateSkinMaterial, 'shininess')
  addAnnotator(annotatePose, 'activeFrameWeight')
  addAnnotator(annotateVector, 'x', 'y', 'z')
}

export function annotateState (state) {
  if (!ANNOTATORS.length) setupAnnotators()
  Object.keys(state).forEach((key) => {
    const value = state[key]
    if (typeof value !== 'object') return
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
    state[key] !== undefined && prev === true
  ), true)
}

const colorPicker = annotate({
  control: controls.ColorPicker
})
const lightIntensity = annotate({
  min: 0,
  max: 6,
  step: 0.1
})

function annotateVector ({ x, y, z }, range = 40, step = 0.5) {
  const rangeX = annotate({ min: x - range, max: x + range, step })
  const rangeY = annotate({ min: y - range, max: y + range, step })
  const rangeZ = annotate({ min: z - range, max: z + range, step })
  return {
    @rangeX x,
    @rangeY y,
    @rangeZ z
  }
}

function annotateCamera ({
  position, target, up, fov, reset
}) {
  const rangeFov = annotate({ min: 20, max: 120, step: 0.5 })
  return {
    position: annotateVector(position),
    target: annotateVector(target),
    up: annotateVector(up, 1, 0.05),
    @rangeFov fov,
    reset
  }
}

function annotateFog ({
  color, near, far
}) {
  const range = annotate({ min: 1, max: 50, step: 0.1 })
  return {
    @colorPicker color,
    @range near,
    @range far
  }
}

function annotateSkinMaterial ({
  shininess,
  normalScale, textureAnisotropy
}) {
  const shininessRange = annotate({ min: 10, max: 80, step: 0.1 })
  const normalScaleRange = annotate({ min: 0, max: 2, step: 0.05 })
  const textureAnisotropyRange = annotate({ min: 1, max: 8, step: 1 })
  return {
    @shininessRange shininess,
    @normalScaleRange normalScale,
    @textureAnisotropyRange textureAnisotropy
  }
}

function annotatePose ({
  helper,
  frames,
  startFrame,
  targetFrame,
  activeFrameWeight
}) {
  const frameOptions = annotate({
    control: controls.ComboBox,
    options: frames
  })
  const weightRange = annotate({ min: 0, max: 1, step: 0.01 })
  return {
    helper: helper || false,
    @frameOptions startFrame,
    @frameOptions targetFrame,
    @weightRange activeFrameWeight
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
