uniform vec3 color;
uniform float opacity;
uniform float time;

varying vec3 vViewPosition;
varying vec3 vNormal;

#include <fog_pars_fragment>
#include <simplex_noise_3d>

void main() {
  mat3 viewMatrix3 = mat3(viewMatrix);
  vec3 n = normalize(viewMatrix3 * vNormal);
  vec3 p = vec3(viewMatrix3 * vViewPosition);
  vec3 v = normalize(-p);
  float vdn = 1.0 - max(dot(v, n), 0.0);
  float rim = smoothstep(0.4, 1.0, vdn);

  vec3 accumColor = color;

  vec2 coord = gl_FragCoord.xy;
  // TODO: Sync scale with camera control settings
  float nScale = (smoothstep(18.0, 24.0, length(cameraPosition))) * 5.0;
  float n0 = snoise(vec3(coord * nScale * 0.0025 + 0.5, time));
  float n1 = snoise(vec3(coord * nScale * 0.005 + 0.2, time));
  float n2 = snoise(vec3(coord * nScale * 0.01 + 0.1, time));
  float n3 = snoise(vec3(coord * nScale * 0.02, time));

  accumColor += n0 * vec3(0.3, 0.3, 0.9);
  accumColor += n1 * vec3(0.4, 0.3, 0.7);
  accumColor += n2 * vec3(0.2, 0.2, 0.6);
  accumColor += n3 * vec3(0.1);

  accumColor += vec3(rim) * 0.8;

  gl_FragColor = vec4(accumColor, opacity);

  #include <fog_fragment>
}
