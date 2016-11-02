import {
  UniformsLib,
  UniformsUtils
} from 'three'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  createUniforms,
  injectShaderChunk
} from '../utils/material'

const fragmentShader = readFileSync(join(__dirname, '/glsl/crystal.frag'), 'utf8')
const vertexShader = readFileSync(join(__dirname, '/glsl/crystal.vert'), 'utf8')

// TODO: include simplex noise from npm if possible
const simplexNoise3d = readFileSync(join(__dirname, '/glsl/simplex_noise_3d.glsl'), 'utf8')
injectShaderChunk('simplex_noise_3d', simplexNoise3d)

export const CrystalShader = {
  uniforms: UniformsUtils.merge([
    UniformsLib.fog,
    createUniforms({
      color: null,
      opacity: 1,
      time: 0
    })
  ]),
  fragmentShader,
  vertexShader
}
