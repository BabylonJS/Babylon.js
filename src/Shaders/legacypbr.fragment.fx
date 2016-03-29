precision mediump float;

// Constants
#define RECIPROCAL_PI2 0.15915494
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25

uniform vec3 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec4 vAlbedoColor;
uniform vec3 vReflectionColor;
uniform vec4 vLightRadiuses;

// CUSTOM CONTROLS
uniform vec4 vLightingIntensity;
uniform vec4 vCameraInfos;

#ifdef OVERLOADEDVALUES
uniform vec4 vOverloadedIntensity;
uniform vec3 vOverloadedAmbient;
uniform vec3 vOverloadedAlbedo;
uniform vec3 vOverloadedReflectivity;
uniform vec3 vOverloadedEmissive;
uniform vec3 vOverloadedReflection;
uniform vec3 vOverloadedMicroSurface;
#endif

#ifdef OVERLOADEDSHADOWVALUES
uniform vec4 vOverloadedShadowIntensity;
#endif

uniform vec4 vReflectivityColor;
uniform vec3 vEmissiveColor;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Lights
#include<lightFragmentDeclaration>[0]
#include<lightFragmentDeclaration>[1]
#include<lightFragmentDeclaration>[2]
#include<lightFragmentDeclaration>[3]

// Samplers
#ifdef ALBEDO
varying vec2 vAlbedoUV;
uniform sampler2D albedoSampler;
uniform vec2 vAlbedoInfos;
#endif

#ifdef AMBIENT
varying vec2 vAmbientUV;
uniform sampler2D ambientSampler;
uniform vec2 vAmbientInfos;
#endif

#ifdef OPACITY	
varying vec2 vOpacityUV;
uniform sampler2D opacitySampler;
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform vec2 vEmissiveInfos;
uniform sampler2D emissiveSampler;
#endif

#ifdef LIGHTMAP
varying vec2 vLightmapUV;
uniform vec2 vLightmapInfos;
uniform sampler2D lightmapSampler;
#endif

#if defined(REFLECTIVITY)
varying vec2 vReflectivityUV;
uniform vec2 vReflectivityInfos;
uniform sampler2D reflectivitySampler;
#endif

#include<clipPlaneFragmentDeclaration>

// PBR
#include<pbrFunctions>
#include<harmonicsFunctions>
#include<pbrLightFunctions>

void main(void) {
#include<clipPlaneFragment>

    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

    // Base color
    vec4 surfaceAlbedo = vec4(1., 1., 1., 1.);
    vec3 surfaceAlbedoContribution = vAlbedoColor.rgb;
    
    // Alpha
    float alpha = vAlbedoColor.a;

    #ifdef ALBEDO
        surfaceAlbedo = texture2D(albedoSampler, vAlbedoUV);
        surfaceAlbedo = vec4(toLinearSpace(surfaceAlbedo.rgb), surfaceAlbedo.a);

        #ifdef ALPHATEST
            if (baseColor.a < 0.4)
                discard;
        #endif

        #ifdef ALPHAFROMALBEDO
            alpha *= surfaceAlbedo.a;
        #endif

        surfaceAlbedo.rgb *= vAlbedoInfos.y;
    #else
        // No Albedo texture.
        surfaceAlbedo.rgb = surfaceAlbedoContribution;
        surfaceAlbedoContribution = vec3(1., 1., 1.);
    #endif

    #ifdef VERTEXCOLOR
        baseColor.rgb *= vColor.rgb;
    #endif

    #ifdef OVERLOADEDVALUES
        surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);
    #endif

    // Bump
    #ifdef NORMAL
        vec3 normalW = normalize(vNormalW);
    #else
        vec3 normalW = vec3(1.0, 1.0, 1.0);
    #endif

    // Ambient color
    vec3 ambientColor = vec3(1., 1., 1.);

    #ifdef AMBIENT
        ambientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;
        
        #ifdef OVERLOADEDVALUES
            ambientColor.rgb = mix(ambientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);
        #endif
    #endif

    // Reflectivity map
    float microSurface = vReflectivityColor.a;
    vec3 surfaceReflectivityColor = vReflectivityColor.rgb;
    
    #ifdef OVERLOADEDVALUES
        surfaceReflectivityColor.rgb = mix(surfaceReflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);
    #endif

    #ifdef REFLECTIVITY
        vec4 surfaceReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV);
        surfaceReflectivityColor = surfaceReflectivityColorMap.rgb;
        surfaceReflectivityColor = toLinearSpace(surfaceReflectivityColor);

        #ifdef OVERLOADEDVALUES
            surfaceReflectivityColor = mix(surfaceReflectivityColor, vOverloadedReflectivity, vOverloadedIntensity.z);
        #endif

        #ifdef MICROSURFACEFROMREFLECTIVITYMAP
            microSurface = surfaceReflectivityColorMap.a;
        #else
            #ifdef MICROSURFACEAUTOMATIC
                microSurface = computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);
            #endif
        #endif
    #endif

    #ifdef OVERLOADEDVALUES
        microSurface = mix(microSurface, vOverloadedMicroSurface.x, vOverloadedMicroSurface.y);
    #endif

    // Compute N dot V.
    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));

    // Adapt microSurface.
    microSurface = clamp(microSurface, 0., 1.) * 0.98;

    // Compute roughness.
    float roughness = clamp(1. - microSurface, 0.000001, 1.0);
    
    // Lighting
    vec3 lightDiffuseContribution = vec3(0., 0., 0.);

#ifdef OVERLOADEDSHADOWVALUES
    vec3 shadowedOnlyLightDiffuseContribution = vec3(1., 1., 1.);
#endif

#ifdef SPECULARTERM
    vec3 lightSpecularContribution= vec3(0., 0., 0.);
#endif
    float notShadowLevel = 1.; // 1 - shadowLevel
    float NdotL = -1.;
    lightingInfo info;

#include<pbrLightFunctionsCall>[0]
#include<pbrLightFunctionsCall>[1]
#include<pbrLightFunctionsCall>[2]
#include<pbrLightFunctionsCall>[3]

#ifdef SPECULARTERM
    lightSpecularContribution *= vLightingIntensity.w;
#endif

#ifdef OPACITY
    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);

    #ifdef OPACITYRGB
        opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);
        alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;
    #else
        alpha *= opacityMap.a * vOpacityInfos.y;
    #endif

#endif

#ifdef VERTEXALPHA
    alpha *= vColor.a;
#endif

// Reflection
vec3 environmentRadiance = vReflectionColor.rgb;
vec3 environmentIrradiance = vReflectionColor.rgb;

#ifdef OVERLOADEDVALUES
    environmentIrradiance = mix(environmentIrradiance, vOverloadedReflection, vOverloadedMicroSurface.z);
    environmentRadiance = mix(environmentRadiance, vOverloadedReflection, vOverloadedMicroSurface.z);
#endif

environmentRadiance *= vLightingIntensity.z;
environmentIrradiance *= vLightingIntensity.z;

// Compute reflection reflectivity fresnel
vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);
vec3 specularEnvironmentReflectance = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));

// Apply Energy Conservation taking in account the environment level only if the environment is present.
float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);
surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;
environmentRadiance *= specularEnvironmentReflectance;

// Emissive
vec3 surfaceEmissiveColor = vEmissiveColor;
#ifdef EMISSIVE
    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;
    surfaceEmissiveColor = toLinearSpace(emissiveColorTex.rgb) * surfaceEmissiveColor * vEmissiveInfos.y;
#endif

#ifdef OVERLOADEDVALUES
    surfaceEmissiveColor = mix(surfaceEmissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);
#endif

// Composition
#ifdef EMISSIVEASILLUMINATION
    vec3 finalDiffuse = max(lightDiffuseContribution * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;
    
    #ifdef OVERLOADEDSHADOWVALUES
        shadowedOnlyLightDiffuseContribution = max(shadowedOnlyLightDiffuseContribution * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;
    #endif
#else
    #ifdef LINKEMISSIVEWITHALBEDO
        vec3 finalDiffuse = max((lightDiffuseContribution + surfaceEmissiveColor) * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;

        #ifdef OVERLOADEDSHADOWVALUES
            shadowedOnlyLightDiffuseContribution = max((shadowedOnlyLightDiffuseContribution + surfaceEmissiveColor) * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;
        #endif
    #else
        vec3 finalDiffuse = max(lightDiffuseContribution * surfaceAlbedoContribution + surfaceEmissiveColor + vAmbientColor, 0.0) * surfaceAlbedo.rgb;

        #ifdef OVERLOADEDSHADOWVALUES
            shadowedOnlyLightDiffuseContribution = max(shadowedOnlyLightDiffuseContribution * surfaceAlbedoContribution + surfaceEmissiveColor + vAmbientColor, 0.0) * surfaceAlbedo.rgb;
        #endif
    #endif
#endif

#ifdef OVERLOADEDSHADOWVALUES
    finalDiffuse = mix(finalDiffuse, shadowedOnlyLightDiffuseContribution, (1.0 - vOverloadedShadowIntensity.y));
#endif

#ifdef SPECULARTERM
    vec3 finalSpecular = lightSpecularContribution * surfaceReflectivityColor;
#else
    vec3 finalSpecular = vec3(0.0);
#endif

#ifdef SPECULAROVERALPHA
    alpha = clamp(alpha + getLuminance(finalSpecular), 0., 1.);
#endif

#ifdef RADIANCEOVERALPHA
    alpha = clamp(alpha + getLuminance(environmentRadiance), 0., 1.);
#endif

// Composition
// Reflection already includes the environment intensity.
#ifdef EMISSIVEASILLUMINATION
    vec4 finalColor = vec4(finalDiffuse * ambientColor * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance + finalSpecular * vLightingIntensity.x + environmentRadiance + surfaceEmissiveColor * vLightingIntensity.y, alpha);
#else
    vec4 finalColor = vec4(finalDiffuse * ambientColor * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance + finalSpecular * vLightingIntensity.x + environmentRadiance, alpha);
#endif

    finalColor = max(finalColor, 0.0);

#ifdef CAMERATONEMAP
    finalColor.rgb = toneMaps(finalColor.rgb);
#endif

    finalColor.rgb = toGammaSpace(finalColor.rgb);

#ifdef CAMERACONTRAST
    finalColor = contrasts(finalColor);
#endif

    gl_FragColor = finalColor;
}