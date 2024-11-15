#define PI 3.1415927
varying vUV: vec2f;

var depthSampler: texture_2d<f32>;
var worldNormalSampler: texture_2d<f32>;
var voxelTracingSampler : texture_2d<f32>;

uniform blurParameters: vec4f;

#define stridef uniforms.blurParameters.x
#define worldScale uniforms.blurParameters.y
const weights = array<f32, 5>(0.0625, 0.25, 0.375, 0.25, 0.0625);
const nbWeights: i32 = 5;

fn max2(v: vec2f, w: vec2f) -> vec2f {
  return  vec2f(max(v.x, w.x), max(v.y, w.y));
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var gbufferRes = vec2f(textureDimensions(depthSampler, 0));
    var gbufferPixelCoord= vec2i(fragmentInputs.vUV * gbufferRes);

    var shadowRes = vec2f(textureDimensions(voxelTracingSampler, 0));
    var shadowPixelCoord= vec2i(fragmentInputs.vUV * shadowRes);

    var N: vec3f = textureLoad(worldNormalSampler, gbufferPixelCoord, 0).xyz;
    if (length(N) < 0.01) {
      fragmentOutputs.color = vec4f(1.0, 1.0, 0.0, 1.0);
      return fragmentOutputs;
    }

    var depth: f32 = -textureLoad(depthSampler, gbufferPixelCoord, 0).x;

    var X: vec3f =  vec3f(0.0);
    for(var y: i32 = 0; y < nbWeights; y++) {
        for(var x: i32 = 0; x < nbWeights; x++) {
            var gBufferCoords: vec2i = gbufferPixelCoord + i32(stridef) * vec2i(x - (nbWeights >> 1), y - (nbWeights >> 1));
            var shadowCoords: vec2i = shadowPixelCoord + i32(stridef) * vec2i(x - (nbWeights >> 1), y - (nbWeights >> 1));

            var T : vec2f = textureLoad(voxelTracingSampler, shadowCoords, 0).xy;
            var ddepth: f32 = -textureLoad(depthSampler, gBufferCoords, 0).x - depth;
            var dN: vec3f = textureLoad(worldNormalSampler, gBufferCoords, 0).xyz - N;
            var w: f32 = weights[x] * weights[y] *
                      exp2(max(-1000.0 / (worldScale * worldScale), -0.5) *
                               (ddepth * ddepth) -
                           1e1 * dot(dN, dN));

            X +=  vec3f(w * T.x, w * T.y, w);
        }
    }

    fragmentOutputs.color =  vec4f(X.x / X.z, X.y / X.z, 0.0, 1.0);
}