#include<helperFunctions>

#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;
var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;
var iblSource: texture_2d<f32>;
#endif
uniform iblHeight: i32;
uniform iblWidth: i32;

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
    // Compute total normalized luminance of texture.
    var normalization: f32 = 0.0;
    var fWidth: f32 = f32(uniforms.iblWidth);
    var fHeight: f32 = f32(uniforms.iblHeight);
    for (var y: i32 = 0; y < uniforms.iblHeight; y++) {
        var yCoord: f32 = (f32(y) + 0.5) / fHeight;
        var deform: f32 = sin(yCoord * PI);
        for (var x: i32 = 0; x < uniforms.iblWidth; x++) {
            var xCoord: f32 = max(min((f32(x) + 0.5) / fWidth, 1.0), 0.0);
            var luminance: f32 = fetchLuminance(vec2f(xCoord, yCoord));
            normalization += deform * luminance;
        }
    }

    normalization = fWidth * fHeight / (2.0 * PI * normalization);
    fragmentOutputs.color = vec4f(vec3f(normalization), 1.0);
}