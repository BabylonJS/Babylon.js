#include<helperFunctions>

varying vUV: vec2f;

#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;
var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;
var iblSource: texture_2d<f32>;
#endif
var scaledLuminanceSamplerSampler : sampler;
var scaledLuminanceSampler : texture_2d<f32>;
var cdfx: texture_2d<f32>;
var cdfy: texture_2d<f32>;

fn fetchLuminance(coords: vec2f) -> f32 {
    #ifdef IBL_USE_CUBE_MAP
        var direction: vec3f = equirectangularToCubemapDirection(coords);
        var color: vec3f = textureSampleLevel(iblSource, iblSourceSampler, direction, 0.0).rgb;
    #else
        var color: vec3f = textureSampleLevel(iblSource, iblSourceSampler, coords, 0.0).rgb;
    #endif
    // apply same luminance computation as in the CDF shader
    return dot(color, LuminanceEncodeApprox);
}

fn fetchCDFx(x: u32) -> f32 {
    return textureLoad(cdfx,  vec2u(x, 0), 0).x;
}

fn bisectx(size: u32, targetValue: f32) -> f32
{
    var a: u32 = 0;
    var b = size - 1;
    while (b - a > 1) {
        var c: u32 = (a + b) >> 1;
        if (fetchCDFx(c) < targetValue) {
            a = c;
        }
        else {
            b = c;
        }
    }
    return mix( f32(a),  f32(b), (targetValue - fetchCDFx(a)) / (fetchCDFx(b) - fetchCDFx(a))) /  f32(size - 1);
}

fn fetchCDFy(y: u32, invocationId: u32) -> f32 {
    return textureLoad(cdfy,  vec2u(invocationId, y), 0).x;
}

fn bisecty(size: u32, targetValue: f32, invocationId: u32) -> f32
{
    var a: u32 = 0;
    var b = size - 1;
    while (b - a > 1) {
        var c = (a + b) >> 1;
        if (fetchCDFy(c, invocationId) < targetValue) {
            a = c;
        }
        else {
            b = c;
        }
    }
    return mix( f32(a),  f32(b), (targetValue - fetchCDFy(a, invocationId)) / (fetchCDFy(b, invocationId) - fetchCDFy(a,invocationId))) /  f32(size - 1);
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var cdfxSize: vec2u = textureDimensions(cdfx, 0);
    var cdfWidth: u32 = cdfxSize.x;
    var icdfWidth: u32 = cdfWidth - 1;
    var currentPixel: vec2u =  vec2u(fragmentInputs.position.xy);

    // icdfx - stores a mapping from the [0, 1] range to an X offset in the CDF.
    // A random value, r, translates to an offset in the CDF where r% of the 
    // cummulative luminance is below that offset. This way, random values will
    // concentrate in the areas of the IBL with higher luminance.
    var outputColor: vec3f = vec3f(1.0);
    if (currentPixel.x == 0)
    {
        outputColor.x =  0.0;
    }
    else if (currentPixel.x == icdfWidth - 1) {
        outputColor.x =  1.0;
    } else {
        var targetValue: f32 = fetchCDFx(cdfWidth - 1) * input.vUV.x;
        outputColor.x =  bisectx(cdfWidth, targetValue);
    }

    // icdfy - stores a mapping from the [0, 1] range to a Y offset in the CDF.
    var cdfySize: vec2u = textureDimensions(cdfy, 0);
    var cdfHeight: u32 = cdfySize.y;
    
    if (currentPixel.y == 0) {
        outputColor.y =  0.0;
    }
    else if (currentPixel.y == cdfHeight - 2) {
        outputColor.y =  1.0;
    } else {
        var targetValue: f32 = fetchCDFy(cdfHeight - 1, currentPixel.x) * input.vUV.y;
        outputColor.y =  max(bisecty(cdfHeight, targetValue, currentPixel.x), 0.0);
    }

    // Compute the luminance of the current pixel, normalize it and store it in the blue channel.
    // We sample the highest mip, which represents the average luminance.
    var size : vec2f = vec2f(textureDimensions(scaledLuminanceSampler, 0));
    var highestMip: f32 = floor(log2(size.x));
    var normalization : f32 = textureSampleLevel(scaledLuminanceSampler,
                                                 scaledLuminanceSamplerSampler,
                                                 input.vUV, highestMip)
                                  .r;
    var pixelLuminance: f32 = fetchLuminance(input.vUV);
    outputColor.z = pixelLuminance / (2.0 * PI * normalization);

    fragmentOutputs.color = vec4( outputColor, 1.0);
}