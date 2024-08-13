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

    var normalSamplerSampler: sampler;
var normalSampler: texture_2d<f32>;
    var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;
#endif

fn main()
{
#ifdef SSRAYTRACE_DEBUG
    fragmentOutputs.color = texture2D(textureSampler, vUV);
#else
    var SSR: vec3f = texture2D(textureSampler, vUV).rgb;
    var color: vec4f = texture2D(mainSampler, vUV);
    var reflectivity: vec4f = texture2D(reflectivitySampler, vUV);

#ifndef SSR_DISABLE_REFLECTIVITY_TEST
    if (max(reflectivity.r, max(reflectivity.g, reflectivity.b)) <= reflectivityThreshold) {
        fragmentOutputs.color = color;
        return;
    }
#endif

#ifdef SSR_INPUT_IS_GAMMA_SPACE
    color = toLinearSpace(color);
#endif

#ifdef SSR_BLEND_WITH_FRESNEL
    var texSize: vec2f =  vec2f(textureSize(depthSampler, 0));

    var csNormal: vec3f = texelFetch(normalSampler, i vec2f(vUV * texSize), 0).xyz;
    var depth: f32 = texelFetch(depthSampler, i vec2f(vUV * texSize), 0).r;
    var csPosition: vec3f = computeViewPosFromUVDepth(vUV, depth, projection, invProjectionMatrix);
    var csViewDirection: vec3f = normalize(csPosition);

    var F0: vec3f = reflectivity.rgb;
    var fresnel: vec3f = fresnelSchlickGGX(max(dot(csNormal, -csViewDirection), 0.0), F0,  vec3f(1.));

    var reflectionMultiplier: vec3f = clamp(pow(fresnel * strength,  vec3f(reflectionSpecularFalloffExponent)), 0.0, 1.0);
#else
    var reflectionMultiplier: vec3f = clamp(pow(reflectivity.rgb * strength,  vec3f(reflectionSpecularFalloffExponent)), 0.0, 1.0);
#endif

    var colorMultiplier: vec3f = 1.0 - reflectionMultiplier;

    var finalColor: vec3f = (color.rgb * colorMultiplier) + (SSR * reflectionMultiplier);
    #ifdef SSR_OUTPUT_IS_GAMMA_SPACE
        finalColor = toGammaSpace(finalColor);
    #endif

    fragmentOutputs.color =  vec4f(finalColor, color.a);
#endif
}
