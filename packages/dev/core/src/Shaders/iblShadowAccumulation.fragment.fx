#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;

uniform vec4 accumulationParameters;

#define remanence accumulationParameters.x
#define resetb accumulationParameters.y

uniform sampler2D motionSampler;            // RG16F
uniform sampler2D localPositionSampler;     // RGBA16_SNORM
uniform sampler2D shadowSampler;            // RG8
uniform sampler2D oldAccumulationSampler;   // RG32F
uniform sampler2D prevLocalPositionSampler; // RGBA16_SNORM

vec2 max2(vec2 v, vec2 w) { return vec2(max(v.x, w.x), max(v.y, w.y)); }

void main(void) {
  bool reset = bool(resetb);
  vec2 Resolution = vec2(textureSize(shadowSampler, 0));
  ivec2 currentPixel = ivec2(max2(vUV * Resolution - vec2(0.5), vec2(0.0)));
  vec4 LP = texture(localPositionSampler, vUV);
  // vec4 LP = texelFetch(localPositionSampler, currentPixel, 0);
  if (0.0 == LP.w) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec2 velocityColor = texelFetch(motionSampler, currentPixel, 0).xy;
  velocityColor.rg = velocityColor.rg * 2.0 - vec2(1.0);

  vec2 prevCoord = vUV + velocityColor;
  vec3 PrevLP = texture(prevLocalPositionSampler, prevCoord).xyz;
  vec2 PrevShadows = texture(oldAccumulationSampler, prevCoord).xy;
  float newShadows = texelFetch(shadowSampler, currentPixel, 0).x;

  PrevShadows.y =
      !reset && all(lessThan(abs(prevCoord - vec2(0.5)), vec2(0.5))) &&
              distance(LP.xyz, PrevLP) < 5e-2
          ? max(PrevShadows.y / (1.0 + PrevShadows.y), 1.0 - remanence)
          : 1.0;
  PrevShadows = max(vec2(0.0), PrevShadows);

  gl_FragColor =
      vec4(mix(PrevShadows.x, newShadows, PrevShadows.y), PrevShadows.y, 0, 0);
}