varying vUV: vec2f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var depthSampler: sampler;
var depthTexture: texture_2d<f32>;
var normalSampler: sampler;
var normalTexture: texture_2d<f32>;
var positionSampler: sampler;
var positionTexture: texture_2d<f32>;
var velocitySampler: sampler;
var velocityTexture: texture_2d<f32>;
uniform sizeParams: vec4f;
uniform maxDepth: f32;

#define offsetX uniforms.sizeParams.x
#define offsetY uniforms.sizeParams.y
#define widthScale uniforms.sizeParams.z
#define heightScale uniforms.sizeParams.w

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  var uv: vec2f =
       vec2f((offsetX + input.vUV.x) * widthScale, (offsetY + input.vUV.y) * heightScale);
  var backgroundColour: vec4f = textureSample(textureSampler, textureSamplerSampler, input.vUV).rgba;
  var depth: vec4f = textureSample(depthTexture, depthSampler, input.vUV);
  var worldNormal: vec4f = textureSample(normalTexture, normalSampler, input.vUV);
  var worldPosition: vec4f = textureSample(positionTexture, positionSampler, input.vUV);
  var velocityLinear: vec4f = textureSample(velocityTexture, velocitySampler, input.vUV);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragmentOutputs.color = backgroundColour;
  } else {
    if (uv.x <= 0.25) {
      fragmentOutputs.color = vec4f(depth.rgb, 1.0);
    } else if (uv.x <= 0.5) {
      velocityLinear = vec4f(velocityLinear.r * 0.5 + 0.5, velocityLinear.g * 0.5 + 0.5, velocityLinear.b, velocityLinear.a);
      fragmentOutputs.color = vec4f(velocityLinear.rgb, 1.0);
    } else if (uv.x <= 0.75) {
      fragmentOutputs.color = vec4f(worldPosition.rgb, 1.0);
    } else {
      fragmentOutputs.color = vec4f(worldNormal.rgb, 1.0);
    }
  }
}