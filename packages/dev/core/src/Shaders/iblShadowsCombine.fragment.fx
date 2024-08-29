precision highp float;
varying vec2 vUV;

uniform sampler2D sceneTexture;
uniform sampler2D textureSampler;
uniform float shadowOpacity;

void main(void)
{
  vec3 color = texture(sceneTexture, vUV).rgb;
  vec3 shadow = texture(textureSampler, vUV).rgb;
  float shadowValue = mix(1.0, shadow.x, shadowOpacity);
  gl_FragColor = vec4(color * shadowValue, 1.0);
}