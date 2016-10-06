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

export const SkinShader = {
  uniforms: UniformsUtils.merge([
    UniformsLib.fog,
    UniformsLib.lights,
    {
      passID: { value: 0 },

      tDiffuse: { value: null },
      tNormal: { value: null },

      tBlur1: { value: null },
      tBlur2: { value: null },
      tBlur3: { value: null },
      tBlur4: { value: null },

      tBeckmann: { value: null },

      uNormalScale: { value: 1.0 },

      diffuse: { value: new Color(0xeeeeee) },
      specular: { value: new Color(0x111111) },
      opacity: { value: 1 },

      uRoughness: { value: 0.15 },
      uSpecularBrightness: { value: 0.75 }
    }
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
