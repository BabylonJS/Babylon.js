precision highp float;
varying vec2 vUV;

#include<helperFunctions>

uniform sampler2D sceneTexture;
uniform sampler2D textureSampler;
uniform sampler2D irradianceSampler;
uniform sampler2D reflectivitySampler;
uniform float shadowOpacity;

void main(void) {
  vec3 color = toLinearSpace(texture(sceneTexture, vUV).rgb);
  vec3 shadow = toLinearSpace(texture(textureSampler, vUV).rgb);
  vec4 reflectivity = toLinearSpace(texture(reflectivitySampler, vUV));
  vec4 irradiance = texture(irradianceSampler, vUV);
  float shadowValue = mix(1.0, shadow.x, shadowOpacity);
  float specularShadowValue = mix(shadowValue, 1.0, reflectivity.a);
  gl_FragColor = toGammaSpace(vec4(color.rgb * shadowValue + reflectivity.rgb * specularShadowValue, 1.0));
}