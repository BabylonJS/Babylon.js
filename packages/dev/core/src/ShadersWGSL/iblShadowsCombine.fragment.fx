varying vUV: vec2f;

var sceneTextureSampler: sampler;
var sceneTexture: texture_2d<f32>;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
uniform shadowOpacity: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  var color: vec3f = textureSample(sceneTexture, sceneTextureSampler, input.vUV).rgb;
  var shadow: vec3f = textureSample(textureSampler, textureSamplerSampler, input.vUV).rgb;
  var shadowValue: f32 = mix(1.0, shadow.x, uniforms.shadowOpacity);
  fragmentOutputs.color = vec4f(color * shadowValue, 1.0);
}