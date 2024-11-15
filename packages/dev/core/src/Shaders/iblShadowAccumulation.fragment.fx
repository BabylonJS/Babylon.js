#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;

uniform vec4 accumulationParameters;

#define remanence accumulationParameters.x
#define resetb accumulationParameters.y
#define sceneSize accumulationParameters.z

uniform sampler2D motionSampler;
uniform sampler2D positionSampler;
uniform sampler2D spatialBlurSampler;
uniform sampler2D oldAccumulationSampler;
uniform sampler2D prevPositionSampler;

vec2 max2(vec2 v, vec2 w) { return vec2(max(v.x, w.x), max(v.y, w.y)); }

void main(void) {
  bool reset = bool(resetb);
  vec2 gbufferRes = vec2(textureSize(motionSampler, 0));
  ivec2 gbufferPixelCoord = ivec2(vUV * gbufferRes);
  vec2 shadowRes = vec2(textureSize(spatialBlurSampler, 0));
  ivec2 shadowPixelCoord = ivec2(vUV * shadowRes);

  vec4 LP = texelFetch(positionSampler, gbufferPixelCoord, 0);
  if (0.0 == LP.w) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 velocityColor = texelFetch(motionSampler, gbufferPixelCoord, 0).xy;
  vec2 prevCoord = vUV + velocityColor;
  vec3 PrevLP = texture(prevPositionSampler, prevCoord).xyz;
  vec3 PrevShadows = texture(oldAccumulationSampler, prevCoord).xyz;
  vec2 newShadows = texelFetch(spatialBlurSampler, shadowPixelCoord, 0).xy;

  PrevShadows.z =
      !reset && all(lessThan(abs(prevCoord - vec2(0.5)), vec2(0.5))) &&
              distance(LP.xyz, PrevLP) < 5e-2 * sceneSize
          ? max(PrevShadows.z / (1.0 + PrevShadows.z), 1.0 - remanence)
          : 1.0;
  PrevShadows = max(vec3(0.0), PrevShadows);

  gl_FragColor =
      vec4(mix(PrevShadows.x, newShadows.x, PrevShadows.z),
           mix(PrevShadows.y, newShadows.y, PrevShadows.z), PrevShadows.z, 1.0);
}