#include<helperFunctions>

// samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

// uniforms
uniform intensity: f32;
uniform animatedSeed: f32;


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, input.vUV);
	var seed: vec2f = input.vUV * uniforms.animatedSeed;
    var grain: f32 = dither(seed, uniforms.intensity);

    // Add less grain when luminance is high or low
    var lum: f32 = getLuminance(fragmentOutputs.color.rgb);
    var grainAmount: f32 = (cos(-PI + (lum*PI*2.))+1.)/2.;
    fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb + grain * grainAmount, fragmentOutputs.color.a);

    fragmentOutputs.color = vec4f(max(fragmentOutputs.color.rgb, vec3f(0.0)), fragmentOutputs.color.a);
}