varying vUV: vec2f;

uniform albedoColor: vec4f;

#ifdef INNERGLOW
uniform innerGlowColor: vec4f;
#endif

#ifdef BORDER
varying scaleInfo: vec2f;
uniform edgeSmoothingValue: f32;
uniform borderMinValue: f32;
#endif

#ifdef HOVERLIGHT
varying worldPosition: vec3f;
uniform hoverPosition: vec3f;
uniform hoverColor: vec4f;
uniform hoverRadius: f32;
#endif

#ifdef TEXTURE
uniform textureMatrix: mat4x4f;
var albedoSamplerSampler: sampler;
var albedoSampler: texture_2d<f32>;
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var albedo: vec3f = uniforms.albedoColor.rgb;
    var alpha: f32 = uniforms.albedoColor.a;

#ifdef TEXTURE
    let finalUV: vec2f = (uniforms.textureMatrix * vec4f(input.vUV, 1.0, 0.0)).xy;
    albedo = textureSample(albedoSampler, albedoSamplerSampler, finalUV).rgb;
#endif

#ifdef HOVERLIGHT
    let pointToHover: f32 = (1.0 - clamp(length(uniforms.hoverPosition - input.worldPosition) / uniforms.hoverRadius, 0.0, 1.0)) * uniforms.hoverColor.a;
    albedo = clamp(albedo + uniforms.hoverColor.rgb * pointToHover, vec3f(0.0), vec3f(1.0));
#else
    let pointToHover: f32 = 1.0;
#endif

#ifdef BORDER
    let borderPower: f32 = 10.0;
    let inverseBorderPower: f32 = 1.0 / borderPower;
    var borderColor: vec3f = albedo * borderPower;
    let distanceToEdge: vec2f = abs(input.vUV - vec2f(0.5)) * 2.0;
    let borderValue: f32 = max(
        smoothstep(input.scaleInfo.x - uniforms.edgeSmoothingValue, input.scaleInfo.x + uniforms.edgeSmoothingValue, distanceToEdge.x),
        smoothstep(input.scaleInfo.y - uniforms.edgeSmoothingValue, input.scaleInfo.y + uniforms.edgeSmoothingValue, distanceToEdge.y)
    );
    borderColor = borderColor * borderValue * max(uniforms.borderMinValue * inverseBorderPower, pointToHover);
    albedo += borderColor;
    alpha = max(alpha, borderValue);
#endif

#ifdef INNERGLOW
    var uvGlow: vec2f = (input.vUV - vec2f(0.5)) * (uniforms.innerGlowColor.a * 2.0);
    uvGlow = uvGlow * uvGlow;
    uvGlow = uvGlow * uvGlow;

    albedo += mix(vec3f(0.0), uniforms.innerGlowColor.rgb, uvGlow.x + uvGlow.y);
#endif

    fragmentOutputs.color = vec4f(albedo, alpha);
}
