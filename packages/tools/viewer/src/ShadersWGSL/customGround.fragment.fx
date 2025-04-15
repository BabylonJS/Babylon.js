var shadowTextureSampler: sampler;
var shadowTexture : texture_2d<f32>;

uniform shadowOpacity : f32;
uniform renderTargetSize: vec2<f32>;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uvBasedOpacity = 1.0 - pow(clamp(length(input.vUV * vec2<f32>(2.0) - vec2<f32>(1.0)), 0.0, 1.0), 2.0);
    let screenUv = fragmentInputs.position.xy / uniforms.renderTargetSize;

    let shadowValue = textureSampleLevel(shadowTexture, shadowTextureSampler, screenUv, 0.0).rrr;
    let totalOpacity = uniforms.shadowOpacity * uvBasedOpacity;
    let finalShadowValue = mix(vec3<f32>(1.0), shadowValue, totalOpacity);
    let invertedShadowValue = vec3(1.0) - shadowValue;
    fragmentOutputs.color = vec4f(finalShadowValue, invertedShadowValue.r * totalOpacity);
}