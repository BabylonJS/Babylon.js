// Parameters
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
uniform delta: vec2f;

// Varying
varying sampleCenter: vec2f;

#ifdef DOF
    var circleOfConfusionSamplerSampler: sampler;
    var circleOfConfusionSampler: texture_2d<f32>;

    fn sampleCoC(offset: vec2f) -> f32 {
        var coc: f32 = textureSample(circleOfConfusionSampler, circleOfConfusionSamplerSampler, offset).r;
        return coc; // actual distance from the lens
    }
#endif

#include<kernelBlurVaryingDeclaration>[0..varyingCount]

#ifdef PACKEDFLOAT
    #include<packingFunctions>
#endif


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var computedWeight: f32 = 0.0;

    #ifdef PACKEDFLOAT
        var blend: f32 = 0.;
    #else
        var blend: vec4f =  vec4f(0.);
    #endif

    #ifdef DOF
        var sumOfWeights: f32 = CENTER_WEIGHT; // Since not all values are blended, keep track of sum to devide result by at the end to get an average (start at center weight as center pixel is added by default)
        var factor: f32 = 0.0;

        // Add center pixel to the blur by default
        #ifdef PACKEDFLOAT
            blend += unpack(textureSample(textureSampler, textureSamplerSampler, input.sampleCenter)) * CENTER_WEIGHT;
        #else
            blend += textureSample(textureSampler, textureSamplerSampler, input.sampleCenter) * CENTER_WEIGHT;
        #endif
    #endif

    #include<kernelBlurFragment>[0..varyingCount]
    #include<kernelBlurFragment2>[0..depCount]

    #ifdef PACKEDFLOAT
        fragmentOutputs.color = pack(blend);
    #else
        fragmentOutputs.color = blend;
    #endif

    #ifdef DOF
        fragmentOutputs.color /= sumOfWeights;
    #endif
}