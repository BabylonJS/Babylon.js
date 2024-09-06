precision highp float;
varying vec2 vUV;

uniform sampler2D sceneTexture;
uniform sampler2D textureSampler;
uniform sampler2D irradianceSampler;
uniform sampler2D reflectivitySampler;
uniform float shadowOpacity;

void main(void) {
  vec3 color = texture(sceneTexture, vUV).rgb;
  vec3 shadow = texture(textureSampler, vUV).rgb;
  vec4 reflectivity = texture(reflectivitySampler, vUV);
  vec4 irradiance = texture(irradianceSampler, vUV);
  float shadowValue = mix(1.0, shadow.x, shadowOpacity);
  shadowValue = mix(shadowValue, 1.0, reflectivity.a);
  gl_FragColor = vec4(color.rgb * shadowValue, 1.0);
}