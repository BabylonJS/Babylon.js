var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>; // blur
var mainSamplerSampler: sampler;
var mainSampler: texture_2d<f32>;
var reflectivitySamplerSampler: sampler;
var reflectivitySampler: texture_2d<f32>;

uniform strength: f32;
uniform reflectionSpecularFalloffExponent: f32;
uniform reflectivityThreshold: f32;

varying vUV: vec2f;

#include<helperFunctions>

#ifdef SSR_BLEND_WITH_FRESNEL
    #include<pbrBRDFFunctions>
    #include<screenSpaceRayTrace>

    uniform projection: mat4x4f;
    uniform invProjectionMatrix: mat4x4f;

    var normalSampler: texture_2d<f32>;
    var depthSampler: texture_2d<f32>;

    #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
        uniform nearPlaneZ: f32;
        uniform farPlaneZ: f32;
    #endif
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#ifdef SSRAYTRACE_DEBUG
    fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, input.vUV);
#else
    var SSR: vec3f = textureSample(textureSampler, textureSamplerSampler,input.vUV).rgb;
    var color: vec4f = textureSample(mainSampler, textureSamplerSampler,input.vUV);
    var reflectivity: vec4f = textureSample(reflectivitySampler, reflectivitySamplerSampler, input.vUV);

#ifndef SSR_DISABLE_REFLECTIVITY_TEST
    if (max(reflectivity.r, max(reflectivity.g, reflectivity.b)) <= uniforms.reflectivityThreshold) {
        fragmentOutputs.color = color;
        return fragmentOutputs;
    }
#endif

#ifdef SSR_INPUT_IS_GAMMA_SPACE
    color = toLinearSpaceVec4(color);
#endif

#ifdef SSR_BLEND_WITH_FRESNEL
    var texSize: vec2f =  vec2f(textureDimensions(depthSampler, 0));

    var csNormal: vec3f = textureLoad(normalSampler, vec2<i32>(input.vUV * texSize), 0).xyz;
    var depth: f32 = textureLoad(depthSampler, vec2<i32>(input.vUV * texSize), 0).r;
    #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
        depth = linearizeDepth(depth, uniforms.nearPlaneZ, uniforms.farPlaneZ);
    #endif
    var csPosition: vec3f = computeViewPosFromUVDepth(input.vUV, depth, uniforms.projection, uniforms.invProjectionMatrix);
    var csViewDirection: vec3f = normalize(csPosition);

    var F0: vec3f = reflectivity.rgb;
    var fresnel: vec3f = fresnelSchlickGGXVec3(max(dot(csNormal, -csViewDirection), 0.0), F0,  vec3f(1.));

    var reflectionMultiplier: vec3f = clamp(pow(fresnel * uniforms.strength,  vec3f(uniforms.reflectionSpecularFalloffExponent)), vec3f(0.0), vec3f(1.0));
#else
    var reflectionMultiplier: vec3f = clamp(pow(reflectivity.rgb * uniforms.strength,  vec3f(uniforms.reflectionSpecularFalloffExponent)), vec3f(0.0), vec3f(1.0));
#endif

    var colorMultiplier: vec3f = 1.0 - reflectionMultiplier;

    var finalColor: vec3f = (color.rgb * colorMultiplier) + (SSR * reflectionMultiplier);
    #ifdef SSR_OUTPUT_IS_GAMMA_SPACE
        finalColor = toGammaSpaceVec3(finalColor);
    #endif

    fragmentOutputs.color =  vec4f(finalColor, color.a);
#endif
}
