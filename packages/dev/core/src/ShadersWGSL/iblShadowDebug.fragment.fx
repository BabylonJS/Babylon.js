varying vUV: vec2f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var debugSamplerSampler: sampler;
var debugSampler: texture_2d<f32>;
uniform sizeParams: vec4f;

#define offsetX uniforms.sizeParams.x
#define offsetY uniforms.sizeParams.y
#define widthScale uniforms.sizeParams.z
#define heightScale uniforms.sizeParams.w

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  var uv: vec2f =
       vec2f((offsetX + fragmentInputs.vUV.x) * widthScale, (offsetY + fragmentInputs.vUV.y) * heightScale);
  var background: vec4f = textureSample(textureSampler, textureSamplerSampler, fragmentInputs.vUV);
  var debugColour: vec4f = textureSample(debugSampler, debugSamplerSampler, fragmentInputs.vUV);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragmentOutputs.color = background;
  } else {
    fragmentOutputs.color = vec4f(mix(debugColour.rgb, background.rgb, 0.0), 1.0);
  }
}