#define DISABLE_UNIFORMITY_ANALYSIS

// Varyings
varying vUV: vec2f;

// Uniforms
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var maskTextureSamplerSampler: sampler;
var maskTextureSampler: texture_2d<f32>;
uniform textureSize: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var mask: vec4f = textureSample(maskTextureSampler, maskTextureSamplerSampler, input.vUV).rgba;

    if (mask.r > 0.5) {
        fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, input.vUV);
    } else {
        var texelSize: vec2f = 4.0 / uniforms.textureSize;

        var uv_p01: vec2f = input.vUV +  vec2f(-1.0, 0.0) * texelSize;
        var uv_p21: vec2f = input.vUV +  vec2f(1.0, 0.0) * texelSize;
        var uv_p10: vec2f = input.vUV +  vec2f(0.0, -1.0) * texelSize;
        var uv_p12: vec2f = input.vUV +  vec2f(0.0, 1.0) * texelSize;

        var mask_p01: f32 = textureSample(maskTextureSampler, maskTextureSamplerSampler, uv_p01).r;
        var mask_p21: f32 = textureSample(maskTextureSampler, maskTextureSamplerSampler, uv_p21).r;
        var mask_p10: f32 = textureSample(maskTextureSampler, maskTextureSamplerSampler, uv_p10).r;
        var mask_p12: f32 = textureSample(maskTextureSampler, maskTextureSamplerSampler, uv_p12).r;

        var col: vec4f =  vec4f(0.0, 0.0, 0.0, 0.0);
        var total_weight: f32 = 0.0;

        if (mask_p01 > 0.5) {
            col += textureSample(textureSampler, textureSamplerSampler, uv_p01);
            total_weight += 1.0;
        }
        if (mask_p21 > 0.5) {
            col += textureSample(textureSampler, textureSamplerSampler, uv_p21);
            total_weight += 1.0;
        }
        if (mask_p10 > 0.5) {
            col += textureSample(textureSampler, textureSamplerSampler, uv_p10);
            total_weight += 1.0;
        }
        if (mask_p12 > 0.5) {
            col += textureSample(textureSampler, textureSamplerSampler, uv_p12);
            total_weight += 1.0;
        }

        if (total_weight > 0.0) {
            fragmentOutputs.color = col / total_weight;
        } else {
            fragmentOutputs.color = col;
        }
    }
}
