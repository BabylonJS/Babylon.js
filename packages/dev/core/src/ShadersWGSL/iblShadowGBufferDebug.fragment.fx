varying vUV: vec2f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var prePass_NdcDepthSampler: sampler;
var prePass_NdcDepth: texture_2d<f32>;
var prePass_WorldNormalSampler: sampler;
var prePass_WorldNormal: texture_2d<f32>;
var prePass_PositionSampler: sampler;
var prePass_Position: texture_2d<f32>;
var prePass_LocalPositionSampler: sampler;
var prePass_LocalPosition: texture_2d<f32>;
var prePass_VelocityLinearSampler: sampler;
var prePass_VelocityLinear: texture_2d<f32>;
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
  var depth: vec4f = textureSample(prePass_NdcDepth, prePass_NdcDepthSampler, input.vUV);
  var worldNormal: vec4f = textureSample(prePass_WorldNormal, prePass_WorldNormalSampler, input.vUV);
  var worldPosition: vec4f = textureSample(prePass_Position, prePass_PositionSampler, input.vUV);
  var localPosition: vec4f = textureSample(prePass_LocalPosition, prePass_LocalPositionSampler, input.vUV);
  var velocityLinear: vec4f = textureSample(prePass_VelocityLinear, prePass_VelocityLinearSampler, input.vUV);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragmentOutputs.color = backgroundColour;
  } else {
    if (uv.x <= 0.2) { // show only depth texture
      fragmentOutputs.color = vec4f(depth.rgb, 1.0);
    } else if (uv.x <= 0.4) {
      velocityLinear = vec4f(velocityLinear.r * 0.5 + 0.5, velocityLinear.g * 0.5 + 0.5, velocityLinear.b, velocityLinear.a);
      fragmentOutputs.color = vec4f(velocityLinear.rgb, 1.0);
    } else if (uv.x <= 0.6) {
      fragmentOutputs.color = vec4f(worldPosition.rgb, 1.0);
    } else if (uv.x <= 0.8) {
      fragmentOutputs.color = vec4f(localPosition.rgb, 1.0);
    } else {
      fragmentOutputs.color = vec4f(worldNormal.rgb, 1.0);
    }
  }
}