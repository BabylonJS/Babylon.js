precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D depthSampler;
uniform sampler2D worldNormalSampler;
uniform sampler2D voxelTracingSampler;

uniform vec4 blurParameters;

#define stridef blurParameters.x
#define worldScale blurParameters.y
const float weights[5] = float[5](0.0625, 0.25, 0.375, 0.25, 0.0625);
const int nbWeights = 5;

vec2 max2(vec2 v, vec2 w) {
  return vec2(max(v.x, w.x), max(v.y, w.y));
}

void main(void)
{
    vec2 gbufferRes = vec2(textureSize(depthSampler, 0));
    ivec2 gbufferPixelCoord = ivec2(vUV * gbufferRes);
    vec2 shadowRes = vec2(textureSize(voxelTracingSampler, 0));
    ivec2 shadowPixelCoord = ivec2(vUV * shadowRes);

    vec3 N = texelFetch(worldNormalSampler, gbufferPixelCoord, 0).xyz;
    if (length(N) < 0.01) {
      glFragColor = vec4(1.0, 1.0, 0.0, 1.0);
      return;
    }

    float depth = -texelFetch(depthSampler, gbufferPixelCoord, 0).x;

    vec3 X = vec3(0.0);
    for(int y = 0; y < nbWeights; ++y) {
        for(int x = 0; x < nbWeights; ++x) {
          ivec2 gBufferCoords = gbufferPixelCoord + int(stridef) * ivec2(x - (nbWeights >> 1), y - (nbWeights >> 1));
          ivec2 shadowCoords = shadowPixelCoord + int(stridef) * ivec2(x - (nbWeights >> 1), y - (nbWeights >> 1));
          vec2 T = texelFetch(voxelTracingSampler, shadowCoords, 0).xy;
          float ddepth = -texelFetch(depthSampler, gBufferCoords, 0).x - depth;
          vec3 dN = texelFetch(worldNormalSampler, gBufferCoords, 0).xyz - N;
          float w = weights[x] * weights[y] *
                    exp2(max(-1000.0 / (worldScale * worldScale), -0.5) *
                             (ddepth * ddepth) -
                         1e1 * dot(dN, dN));

          X += vec3(w * T.x, w * T.y, w);
        }
    }

    gl_FragColor = vec4(X.x / X.z, X.y / X.z, 1.0, 1.0);
}