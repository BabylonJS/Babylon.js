// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

// Constants
uniform _ExposureAdjustment: f32;

#if defined(HABLE_TONEMAPPING)
    const A: f32 = 0.15;
    const B: f32 = 0.50;
    const C: f32 = 0.10;
    const D: f32 = 0.20;
    const E: f32 = 0.02;
    const F: f32 = 0.30;
    const W: f32 = 11.2;
#endif

fn Luminance(c: vec3f) -> f32
{
    return dot(c,  vec3f(0.22, 0.707, 0.071));
}


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var colour: vec3f = textureSample(textureSampler, textureSamplerSampler, input.vUV).rgb;

#if defined(REINHARD_TONEMAPPING)

    var lum: f32 = Luminance(colour.rgb); 
    var lumTm: f32 = lum * uniforms._ExposureAdjustment;
    var scale: f32 = lumTm / (1.0 + lumTm);  

    colour *= scale / lum;

#elif defined(HABLE_TONEMAPPING)

    colour *= uniforms._ExposureAdjustment;

    const ExposureBias: f32 = 2.0;
    var x: vec3f = ExposureBias * colour;

    var curr: vec3f = ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
    
    x =  vec3f(W, W, W);
    var whiteScale: vec3f = 1.0 / (((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F);
    colour = curr * whiteScale;

#elif defined(OPTIMIZED_HEJIDAWSON_TONEMAPPING)

    colour *= uniforms._ExposureAdjustment;
    
    var X: vec3f = max( vec3f(0.0, 0.0, 0.0), colour - 0.004);
    var retColor: vec3f = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);

    colour = retColor * retColor;

#elif defined(PHOTOGRAPHIC_TONEMAPPING)

    colour =  vec3f(1.0, 1.0, 1.0) - exp2(-uniforms._ExposureAdjustment * colour);

#endif

	fragmentOutputs.color =  vec4f(colour.rgb, 1.0);
}