#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;

uniform vec4 accumulationParameters;

#define remanence accumulationParameters.x
#define resetb accumulationParameters.y

uniform sampler2D motionSampler;
uniform sampler2D positionSampler;
uniform sampler2D spatialBlurSampler;
uniform sampler2D oldAccumulationSampler;
uniform sampler2D prevPositionSampler;

vec2 max2(vec2 v, vec2 w) { return vec2(max(v.x, w.x), max(v.y, w.y)); }

void main(void) {
  bool reset = bool(resetb);
  vec2 Resolution = vec2(textureSize(spatialBlurSampler, 0));
  ivec2 currentPixel = ivec2(vUV * Resolution);
  vec4 LP = texelFetch(positionSampler, currentPixel, 0);
  if (0.0 == LP.w) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 velocityColor = texelFetch(motionSampler, currentPixel, 0).xy;
  vec2 prevCoord = vUV + velocityColor;
  vec3 PrevLP = textureLod(prevPositionSampler, prevCoord, 0.0).xyz;
  vec2 PrevShadows = textureLod(oldAccumulationSampler, prevCoord, 0.0).xy;
  float newShadows = texelFetch(spatialBlurSampler, currentPixel, 0).x;

  PrevShadows.y =
      !reset && all(lessThan(abs(prevCoord - vec2(0.5)), vec2(0.5))) &&
              distance(LP.xyz, PrevLP) < 5e-2
          ? max(PrevShadows.y / (1.0 + PrevShadows.y), 1.0 - remanence)
          : 1.0;
  PrevShadows = max(vec2(0.0), PrevShadows);

  gl_FragColor = vec4(mix(PrevShadows.x, newShadows, PrevShadows.y),
                      PrevShadows.y, 0, 1.0);
}