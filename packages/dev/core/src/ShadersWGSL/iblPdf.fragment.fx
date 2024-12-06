#include<helperFunctions>

varying vUV: vec2f;

#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;
var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;
var iblSource: texture_2d<f32>;
#endif
var normalizationSamplerSampler: sampler;
var normalizationSampler: texture_2d<f32>;

#ifdef IBL_USE_CUBE_MAP
fn equirectangularToCubemapDirection(uv: vec2f) -> vec3f {
  var longitude: f32 = uv.x * 2.0 * PI - PI;
  var latitude: f32 = PI * 0.5 - uv.y * PI;
  var direction: vec3f;
  direction.x = cos(latitude) * sin(longitude);
  direction.y = sin(latitude);
  direction.z = cos(latitude) * cos(longitude);
  return direction;
}
#endif

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

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var normalization: f32 = textureSampleLevel(normalizationSampler, normalizationSamplerSampler, vec2f(0.0), 0.0).r;

    // Compute the luminance of the current pixel and normalize it
    var pixelLuminance: f32 = fetchLuminance(input.vUV);

    fragmentOutputs.color = vec4f(vec3f(pixelLuminance * normalization), 1.0);
}