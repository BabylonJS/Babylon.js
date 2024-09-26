const GammaEncodePowerApprox = 1.0 / 2.2;

varying vUV: vec2f;

var textureSamplerSampler: sampler;
var textureSampler: texture_3d<f32>;

uniform lod: f32;
uniform gamma: bool;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uv = vUV * 2.0 - 1.0;
    #ifdef POSITIVEX
        fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vec3f(1.001,uv.y,uv.x), uniforms.lod);
    #endif
    #ifdef NEGATIVEX
        fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vec3f(-1.001,uv.y,uv.x), uniforms.lod);
    #endif
    #ifdef POSITIVEY
        fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vec3f(uv.y,1.001,uv.x), uniforms.lod);
    #endif
    #ifdef NEGATIVEY
        fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vec3f(uv.y,-1.001,uv.x), uniforms.lod);
    #endif
    #ifdef POSITIVEZ
        fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vec3f(uv,1.001), uniforms.lod);
    #endif
    #ifdef NEGATIVEZ
        fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, vec3f(uv,-1.001), uniforms.lod);
    #endif
    if (!gamma) {
        fragmentOutputs.color = vec4f(pow(fragmentOutputs.color, vec3f(GammaEncodePowerApprox)), fragmentOutputs.color.a);
    }
}
