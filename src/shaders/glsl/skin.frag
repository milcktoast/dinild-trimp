// @author alteredq / http://alteredqualia.com/
// @author jpweeks / http://jayweeks.com

uniform vec3 color;
uniform float opacity;
uniform sampler2D map;

uniform float roughness;
uniform vec3 specular;
uniform float specularBrightness;

uniform int passID;

uniform sampler2D tBeckmann;
uniform sampler2D tBlur1;
uniform sampler2D tBlur2;
uniform sampler2D tBlur3;
uniform sampler2D tBlur4;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;

#include <common>
#include <packing>
#include <aomap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars>
#include <shadowmap_pars_fragment>
#include <normalmap_pars_fragment>

struct SkinMaterial {
  int passID;
  vec3  diffuseColor;
  vec3  specularColor;
  float roughness;
  float specularBrightness;
};

float fresnelReflectance(vec3 H, vec3 V, float F0) {
  float base = 1.0 - dot(V, H);
  float exponential = pow(base, 5.0);
  return exponential + F0 * (1.0 - exponential);
}

vec3 BRDF_Specular_Skin(
  const in IncidentLight incidentLight,
  const in GeometricContext geometry,
  const in SkinMaterial material
) {
  vec3 L = incidentLight.direction; // Points to light
  vec3 N = geometry.normal; // Bumped surface normal
  vec3 V = geometry.viewDir; // Points to eye
  float specular = 0.0;
  float ndotl = dot(N, L);

  if (ndotl > 0.0) {
    vec3 h = L + V; // Unnormalized half-way vector
    vec3 H = normalize(h);
    float ndoth = dot(N, H);
    float PH = pow(2.0 * texture2D(tBeckmann, vec2(ndoth, material.roughness)).x, 10.0);
    float F = fresnelReflectance(H, V, 0.028);
    float frSpec = max(PH * F / dot(h, h), 0.0);
    specular = ndotl * frSpec; // BRDF * dot(N,L) * specularBrightness
  }

  return material.specularColor * specular;
}

void RE_Direct_Skin(
  const in IncidentLight directLight,
  const in GeometricContext geometry,
  const in SkinMaterial material,
  inout ReflectedLight reflectedLight
) {
  float dotNL = saturate(dot(geometry.normal, directLight.direction));
  vec3 irradiance = dotNL * directLight.color;
  #ifndef PHYSICALLY_CORRECT_LIGHTS
    irradiance *= PI;
  #endif
  reflectedLight.directDiffuse += irradiance *
    BRDF_Diffuse_Lambert(material.diffuseColor);
  if (material.passID == 1) {
    reflectedLight.directSpecular += irradiance * material.specularBrightness *
      BRDF_Specular_Skin(directLight, geometry, material);
  }
}

void RE_IndirectDiffuse_Skin(
  const in vec3 irradiance,
  const in GeometricContext geometry,
  const in SkinMaterial material,
  inout ReflectedLight reflectedLight
) {
  reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert(material.diffuseColor);
}

#define RE_Direct RE_Direct_Skin
#define RE_IndirectDiffuse RE_IndirectDiffuse_Skin

void main() {
  vec4 diffuseColor = vec4(color, opacity);
  vec4 colDiffuse = texture2D(map, vUv);
  colDiffuse *= colDiffuse;
  diffuseColor *= colDiffuse;
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));

  #include <normal_flip>
  #include <normal_fragment>

  // accumulation
  SkinMaterial material;
  material.passID = passID;
  material.diffuseColor = diffuseColor.rgb;
  material.specularColor = specular;
  material.roughness = roughness;
  material.specularBrightness = specularBrightness;

  #include <lights_template>

  // modulation
  #include <aomap_fragment>

  vec3 totalDiffuseLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  vec3 totalSpecularLight = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
  vec3 outgoingLight = totalDiffuseLight + totalSpecularLight;

  if (passID == 0) {
    outgoingLight = sqrt(outgoingLight);
  } else if (passID == 1) {
    // #define VERSION1
    #ifdef VERSION1
      vec3 nonblurColor = sqrt(outgoingLight);
    #else
      vec3 nonblurColor = outgoingLight;
    #endif

    vec3 blur1Color = texture2D(tBlur1, vUv).rgb;
    vec3 blur2Color = texture2D(tBlur2, vUv).rgb;
    vec3 blur3Color = texture2D(tBlur3, vUv).rgb;
    vec3 blur4Color = texture2D(tBlur4, vUv).rgb;

    outgoingLight = vec3(
      vec3(0.22,  0.437, 0.635) * nonblurColor +
      vec3(0.101, 0.355, 0.365) * blur1Color +
      vec3(0.119, 0.208, 0.0)   * blur2Color +
      vec3(0.114, 0.0,   0.0)   * blur3Color +
      vec3(0.444, 0.0,   0.0)   * blur4Color);

    outgoingLight *= sqrt(colDiffuse.xyz);
    outgoingLight += ambientLightColor * color * colDiffuse.xyz;

    #ifndef VERSION1
      outgoingLight = sqrt(outgoingLight + nonblurColor * 0.5); // FIXME
    #endif
  }

  // TODO, this should be pre-multiplied to allow for bright highlights on very transparent objects
  gl_FragColor = vec4(outgoingLight, diffuseColor.a);

  #include <fog_fragment>
}
