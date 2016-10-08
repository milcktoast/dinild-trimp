// @author alteredq / http://alteredqualia.com/

// ------------------------------------------------------------------------------------------
// Skin shader
//   - Blinn-Phong diffuse term (using normal + diffuse maps)
//   - subsurface scattering approximation by four blur layers
//   - physically based specular term (Kelemen/Szirmay-Kalos specular reflectance)
//
//   - point and directional lights (use with "lights: true" material option)
//
//   - based on Nvidia Advanced Skin Rendering GDC 2007 presentation
//     and GPU Gems 3 Chapter 14. Advanced Techniques for Realistic Real-Time Skin Rendering
//
//     http://developer.download.nvidia.com/presentations/2007/gdc/Advanced_Skin.pdf
//     http://http.developer.nvidia.com/GPUGems3/gpugems3_ch14.html
// ------------------------------------------------------------------------------------------

import {
  UniformsLib,
  UniformsUtils
} from 'three'
import { createUniforms } from '../utils/material'
import { readFileSync } from 'fs'
// import { join } from 'path' // FIXME

/* eslint-disable no-path-concat */
const skinVert = readFileSync(__dirname + '/glsl/skin.vert', 'utf8')
const skinFrag = readFileSync(__dirname + '/glsl/skin.frag', 'utf8')
const uvVert = readFileSync(__dirname + '/glsl/uv.vert', 'utf8')
const beckmannVert = readFileSync(__dirname + '/glsl/beckmann.vert', 'utf8')
const beckmannFrag = readFileSync(__dirname + '/glsl/beckmann.frag', 'utf8')
/* eslint-enable no-path-concat */

export const SkinShader = {
  uniforms: UniformsUtils.merge([
    UniformsLib.fog,
    UniformsLib.lights,
    createUniforms({
      color: null,
      specular: null,
      opacity: 1,

      normalScale: null,
      roughness: 0.15,
      specularBrightness: 0.75,

      map: null,
      normalMap: null,

      passID: 0,
      tBeckmann: null,
      tBlur1: null,
      tBlur2: null,
      tBlur3: null,
      tBlur4: null
    })
  ]),
  fragmentShader: skinFrag,
  vertexShader: skinVert,
  vertexShaderUV: uvVert
}

// ------------------------------------------------------------------------------------------
// Beckmann distribution function
//  - to be used in specular term of skin shader
//  - render a screen-aligned quad to precompute a 512 x 512 texture
//
//    - from http://developer.nvidia.com/node/171
// ------------------------------------------------------------------------------------------

export const BeckmannShader = {
  uniforms: {},
  vertexShader: beckmannVert,
  fragmentShader: beckmannFrag
}
