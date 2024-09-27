#define PI 3.1415927
varying vUV: vec2f;

var cdfySampler: sampler;
var cdfy: texture_2d<f32>;
var icdfySampler: sampler;
var icdfy: texture_2d<f32>;
var cdfxSampler: sampler;
var cdfx: texture_2d<f32>;
var icdfxSampler: sampler;
var icdfx: texture_2d<f32>;
#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;
var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;
var iblSource: texture_2d<f32>;
#endif
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
#define cdfyVSize 0.4
#define cdfxVSize 0.1
#define cdfyHSize 0.5

uniform sizeParams: vec4f;

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

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {  
  var colour: vec3f =  vec3f(0.0);
  var uv: vec2f =
       vec2f((uniforms.sizeParams.x + input.vUV.x) * uniforms.sizeParams.z, (uniforms.sizeParams.y + input.vUV.y) * uniforms.sizeParams.w);
  var backgroundColour: vec3f = textureSample(textureSampler, textureSamplerSampler, input.vUV).rgb;

  const iblStart: f32 = 1.0 - cdfyVSize;
  const cdfyStart: f32 = 1.0 - 2.0 * cdfyVSize;
  const cdfxStart: f32 = 1.0 - 2.0 * cdfyVSize - cdfxVSize;
  const icdfxStart: f32 = 1.0 - 2.0 * cdfyVSize - 2.0 * cdfxVSize;
  // ***** Display all slices as a grid *******
#ifdef IBL_USE_CUBE_MAP

  var direction: vec3f = equirectangularToCubemapDirection(
      (uv -  vec2f(0.0, iblStart)) *  vec2f(1.0, 1.0 / cdfyVSize));
  var iblColour: vec3f = textureSampleLevel(iblSource, iblSourceSampler, direction, 0.0).rgb;
#else
  var iblColour: vec3f = textureSample(iblSource, iblSourceSampler, (uv -  vec2f(0.0, iblStart)) *
                                             vec2f(1.0, 1.0 / cdfyVSize))
                       .rgb;
#endif
  var cdfyColour: f32 =
      textureSample(cdfy, cdfySampler, (uv -  vec2f(0.0, cdfyStart)) *  vec2f(2.0, 1.0 / cdfyVSize)).r;
  var icdfyColour: f32 =
      textureSample(icdfy, icdfySampler, (uv -  vec2f(0.5, cdfyStart)) *  vec2f(2.0, 1.0 / cdfyVSize)).r;
  var cdfxColour: f32 =
      textureSample(cdfx, cdfxSampler, (uv -  vec2f(0.0, cdfxStart)) *  vec2f(1.0, 1.0 / cdfxVSize)).r;
  var icdfxColour: f32 = textureSample(icdfx, icdfxSampler, (uv -  vec2f(0.0, icdfxStart)) *
                                            vec2f(1.0, 1.0 / cdfxVSize)).r;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    colour = backgroundColour;
  } else if (uv.y > iblStart) {
    colour += iblColour;
  } else if (uv.y > cdfyStart && uv.x < 0.5) {
    colour.r += 0.003 * cdfyColour;
  } else if (uv.y > cdfyStart && uv.x > 0.5) {
    colour.r += icdfyColour;
  } else if (uv.y > cdfxStart) {
    colour.r += 0.00003 * cdfxColour;
  } else if (uv.y > icdfxStart) {
    colour.r += icdfxColour;
  }
  fragmentOutputs.color  = vec4(mix(colour, backgroundColour, 0.5), 1.0);
}