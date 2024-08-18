varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

var circleOfConfusionSamplerSampler: sampler;
var circleOfConfusionSampler: texture_2d<f32>;

var blurStep0Sampler: sampler;
var blurStep0: texture_2d<f32>;

#if BLUR_LEVEL > 0
    var blurStep1Sampler: sampler;
    var blurStep1: texture_2d<f32>;
#endif

#if BLUR_LEVEL > 1
    var blurStep2Sampler: sampler;
    var blurStep2: texture_2d<f32>;
#endif


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var coc: f32 = textureSampleLevel(circleOfConfusionSampler, circleOfConfusionSamplerSampler, input.vUV, 0.0).r;
#if BLUR_LEVEL == 0
    var original: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);
    var blurred0: vec4f = textureSampleLevel(blurStep0, blurStep0Sampler, input.vUV, 0.0);
    fragmentOutputs.color = mix(original, blurred0, coc);
#endif
#if BLUR_LEVEL == 1
    if(coc < 0.5){
        var original: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);
        var blurred1: vec4f = textureSampleLevel(blurStep1, blurStep1Sampler, input.vUV, 0.0);
        fragmentOutputs.color = mix(original, blurred1, coc/0.5);
    }else{
        var blurred0: vec4f = textureSampleLevel(blurStep0, blurStep0Sampler, input.vUV, 0.0);
        var blurred1: vec4f = textureSampleLevel(blurStep1, blurStep1Sampler, input.vUV, 0.0);
        fragmentOutputs.color = mix(blurred1, blurred0, (coc-0.5)/0.5);
    }
#endif
#if BLUR_LEVEL == 2
    if(coc < 0.33){
        var original: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);
        var blurred2: vec4f = textureSampleLevel(blurStep2, blurStep2Sampler, input.vUV, 0.0);
        fragmentOutputs.color = mix(original, blurred2, coc/0.33);
    }else if(coc < 0.66){
        var blurred1: vec4f = textureSampleLevel(blurStep1, blurStep1Sampler, input.vUV, 0.0);
        var blurred2: vec4f = textureSampleLevel(blurStep2, blurStep2Sampler, input.vUV, 0.0);
        fragmentOutputs.color = mix(blurred2, blurred1, (coc-0.33)/0.33);
    }else{
        var blurred0: vec4f = textureSampleLevel(blurStep0, blurStep0Sampler, input.vUV, 0.0);
        var blurred1: vec4f = textureSampleLevel(blurStep1, blurStep1Sampler, input.vUV, 0.0);
        fragmentOutputs.color = mix(blurred1, blurred0, (coc-0.66)/0.34);
    }
#endif
}
