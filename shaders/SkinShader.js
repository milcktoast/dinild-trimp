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

// TODO:
// - integrate new lighting system
//   - fix SpotLight calculations
//   - fix HemisphereLight calculations
// - add shadow map support

import {
  Color,
  UniformsLib,
  UniformsUtils
} from 'three'
const glsl = require('glslify')
import { createUniforms } from '../utils/material'

export const SkinShader = {
  uniforms: UniformsUtils.merge([
    UniformsLib.fog,
    UniformsLib.lights,
    createUniforms({
      passID: 0,

      tDiffuse: null,
      tNormal: null,

      tBlur1: null,
      tBlur2: null,
      tBlur3: null,
      tBlur4: null,

      tBeckmann: null,

      diffuse: new Color(0xeeeeee),
      specular: new Color(0x111111),
      opacity: 1,

      normalScale: 1.0,
      roughness: 0.15,
      specularBrightness: 0.75
    })
  ]),
  fragmentShader: glsl.file('./glsl/skin.frag'),
  vertexShader: glsl.file('./glsl/skin.vert'),
  vertexShaderUV: glsl.file('./glsl/uv.vert')
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
  vertexShader: glsl.file('./glsl/beckmann.vert'),
  fragmentShader: glsl.file('./glsl/beckmann.frag')
}
