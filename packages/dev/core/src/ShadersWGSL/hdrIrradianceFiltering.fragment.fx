#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>

var inputTextureSampler: sampler;
var inputTexture: texture_cube<f32>;
#ifdef IBL_CDF_FILTERING
    var icdfTextureSampler: sampler;
    var icdfTexture: texture_2d<f32>;
#endif
uniform vFilteringInfo: vec2f;
uniform hdrScale: f32;

varying direction: vec3f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var color: vec3f = irradiance(inputTexture, inputTextureSampler, input.direction, uniforms.vFilteringInfo
    #ifdef IBL_CDF_FILTERING
        , icdfTexture, icdfTextureSampler
    #endif
    );

    fragmentOutputs.color =  vec4f(color * uniforms.hdrScale, 1.0);
}