// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var passSamplerSampler: sampler;
var passSampler: texture_2d<f32>;


#define CUSTOM_FRAGMENT_DEFINITIONS

fn main(void)
{
    fragmentOutputs.color = textureSample(passSampler, passSamplerSampler, input.vUV);
}