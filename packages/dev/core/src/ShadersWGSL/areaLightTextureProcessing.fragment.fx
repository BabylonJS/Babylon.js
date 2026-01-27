varying vUV: vec2f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform scalingRange: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let x: f32 = (input.vUV.x - uniforms.scalingRange.x) / (uniforms.scalingRange.y - uniforms.scalingRange.x);
    let y: f32 = (input.vUV.y - uniforms.scalingRange.x) / (uniforms.scalingRange.y - uniforms.scalingRange.x);
    let scaledUV: vec2f = vec2f(x, y);
    fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, scaledUV);
}