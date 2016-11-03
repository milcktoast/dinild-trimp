varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;

#include <common>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>

void main() {
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>

  #include <begin_vertex>
  #include <displacementmap_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>

  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(objectNormal);
  vUv = uv;

  #include <worldpos_vertex>
  #include <envmap_vertex>
  #include <shadowmap_vertex>
}
