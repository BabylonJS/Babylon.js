precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D linearDepthSampler;
uniform sampler2D worldNormalSampler;
uniform sampler2D textureSampler;

uniform vec4 blurParameters;

#define stridef blurParameters.x
#define worldScale blurParameters.y
// const int stride = int(stridef);
const float weights[5] = float[5](0.0625, 0.25, 0.375, 0.25, 0.0625);
const int nbWeights = 5;

vec2 max2(vec2 v, vec2 w) {
  return vec2(max(v.x, w.x), max(v.y, w.y));
}

void main(void)
{
    // ivec2 PixCoord = ivec2(gl_GlobalInvocationID.xy);
    vec2 Resolution = vec2(textureSize(linearDepthSampler, 0));
    ivec2 PixelCoord = ivec2(vUV * Resolution);

    vec3 N = texelFetch(worldNormalSampler, PixelCoord, 0).xyz;
    if (length(N) < 0.01) {
      glFragColor = vec4(1.0, 1.0, 0.0, 1.0);
      return;
    }

    float depth = -texelFetch(linearDepthSampler, PixelCoord, 0).x;

    vec2 X = vec2(0.0);
    for(int y = 0; y < nbWeights; ++y) {
        for(int x = 0; x < nbWeights; ++x) {
            ivec2 Coords = PixelCoord +  int(stridef) * ivec2(x - (nbWeights >> 1), y - (nbWeights >> 1));

            vec2 T = texelFetch(textureSampler, Coords, 0).xy;
            float ddepth = -texelFetch(linearDepthSampler, Coords, 0).x - depth;
            vec3 dN = texelFetch(worldNormalSampler, Coords, 0).xyz - N;
            float w = weights[x] * weights[y] *
                      exp2(max(-1000.0 / (worldScale * worldScale), -0.5) *
                               (ddepth * ddepth) -
                           1e1 * dot(dN, dN));

            X += vec2(w * T.x, w);
        }
    }

    gl_FragColor = vec4(X.x / X.y, 1.0, 0.0, 1.0);
}