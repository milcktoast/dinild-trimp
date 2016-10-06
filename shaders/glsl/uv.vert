varying vec3 vNormal;
varying vec2 vUv;

varying vec3 vViewPosition;

#include <common>
#include <shadowmap_pars_vertex>

void main() {
	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

	vViewPosition = -mvPosition.xyz;
	vNormal = normalize(normalMatrix * normal);
	vUv = uv;

	gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);
	#include <shadowmap_vertex>
}
