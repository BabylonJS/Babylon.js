uniform sampler2D textureSampler; // blur
uniform sampler2D mainSampler;
uniform sampler2D reflectivitySampler;

uniform float strength;
uniform float reflectionSpecularFalloffExponent;
uniform float reflectivityThreshold;

varying vec2 vUV;

#include<helperFunctions>

#ifdef SSR_BLEND_WITH_FRESNEL
    #include<pbrBRDFFunctions>
    #include<screenSpaceRayTrace>

    uniform mat4 projection;
    uniform mat4 invProjectionMatrix;

    uniform sampler2D normalSampler;
    uniform sampler2D depthSampler;
    #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
        uniform float nearPlaneZ;
        uniform float farPlaneZ;
    #endif
#endif

void main()
{
#ifdef SSRAYTRACE_DEBUG
    gl_FragColor = texture2D(textureSampler, vUV);
#else
    vec3 SSR = texture2D(textureSampler, vUV).rgb;
    vec4 color = texture2D(mainSampler, vUV);
    vec4 reflectivity = texture2D(reflectivitySampler, vUV);

#ifndef SSR_DISABLE_REFLECTIVITY_TEST
    if (max(reflectivity.r, max(reflectivity.g, reflectivity.b)) <= reflectivityThreshold) {
        gl_FragColor = color;
        return;
    }
#endif

#ifdef SSR_INPUT_IS_GAMMA_SPACE
    color = toLinearSpace(color);
#endif

#ifdef SSR_BLEND_WITH_FRESNEL
    vec2 texSize = vec2(textureSize(depthSampler, 0));

    vec3 csNormal = texelFetch(normalSampler, ivec2(vUV * texSize), 0).xyz;
    float depth = texelFetch(depthSampler, ivec2(vUV * texSize), 0).r;
    #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
        depth = linearizeDepth(depth, nearPlaneZ, farPlaneZ);
    #endif
    vec3 csPosition = computeViewPosFromUVDepth(vUV, depth, projection, invProjectionMatrix);
    vec3 csViewDirection = normalize(csPosition);

    vec3 F0 = reflectivity.rgb;
    vec3 fresnel = fresnelSchlickGGX(max(dot(csNormal, -csViewDirection), 0.0), F0, vec3(1.));

    vec3 reflectionMultiplier = clamp(pow(fresnel * strength, vec3(reflectionSpecularFalloffExponent)), 0.0, 1.0);
#else
    vec3 reflectionMultiplier = clamp(pow(reflectivity.rgb * strength, vec3(reflectionSpecularFalloffExponent)), 0.0, 1.0);
#endif

    vec3 colorMultiplier = 1.0 - reflectionMultiplier;

    vec3 finalColor = (color.rgb * colorMultiplier) + (SSR * reflectionMultiplier);
    #ifdef SSR_OUTPUT_IS_GAMMA_SPACE
        finalColor = toGammaSpace(finalColor);
    #endif

    gl_FragColor = vec4(finalColor, color.a);
#endif
}
