// @author alteredq / http://alteredqualia.com/

#ifdef VERTEX_TEXTURES
  uniform sampler2D tDisplacement;
  uniform float uDisplacementScale;
  uniform float uDisplacementBias;
#endif

varying vec3 vNormal;
varying vec2 vUv;

varying vec3 vViewPosition;

#include <common>

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;

  // displacement mapping
  #ifdef VERTEX_TEXTURES
    vec3 dv = texture2D(tDisplacement, uv).xyz;
    float df = uDisplacementScale * dv.x + uDisplacementBias;
    vec4 displacedPosition = vec4(vNormal.xyz * df, 0.0) + mvPosition;
    gl_Position = projectionMatrix * displacedPosition;
  #else
    gl_Position = projectionMatrix * mvPosition;
  #endif
}
