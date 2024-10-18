precision highp float;
varying vec2 vUV;

uniform sampler2D shadowSampler;
uniform sampler2D textureSampler;
uniform float shadowOpacity;

void main(void)
{
  vec3 shadow = texture(shadowSampler, vUV).rgb;
  vec3 sceneColor = texture(textureSampler, vUV).rgb;
  float shadowValue = mix(1.0, shadow.x, shadowOpacity);
  gl_FragColor = vec4(sceneColor * shadowValue, 1.0);
}