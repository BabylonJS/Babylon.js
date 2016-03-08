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

// PBR CUSTOM CONSTANTS
const float kPi = 3.1415926535897932384626433832795;
const float kRougnhessToAlphaScale = 0.1;
const float kRougnhessToAlphaOffset = 0.29248125;

#include<helperFunctions>

// Based on Beckamm roughness to Blinn exponent + http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html 
float getMipMapIndexFromAverageSlope(float maxMipLevel, float alpha)
{
    // do not take in account lower mips hence -1... and wait from proper preprocess.
    // formula comes from approximation of the mathematical solution.
    //float mip = maxMipLevel + kRougnhessToAlphaOffset + 0.5 * log2(alpha);
    
    // In the mean time 
    // Always [0..1] goes from max mip to min mip in a log2 way.  
    // Change 5 to nummip below.
    // http://www.wolframalpha.com/input/?i=x+in+0..1+plot+(+5+%2B+0.3+%2B+0.1+*+5+*+log2(+(1+-+x)+*+(1+-+x)+%2B+0.0005))
    float mip = kRougnhessToAlphaOffset + maxMipLevel + (maxMipLevel * kRougnhessToAlphaScale * log2(alpha));
    
    return clamp(mip, 0., maxMipLevel);
}

float getMipMapIndexFromAverageSlopeWithPMREM(float maxMipLevel, float alphaG)
{
    float specularPower = clamp(2. / alphaG - 2., 0.000001, 2048.);
    
    // Based on CubeMapGen for cosine power with 2048 spec default and 0.25 dropoff 
    return clamp(- 0.5 * log2(specularPower) + 5.5, 0., maxMipLevel);
}

// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007
float smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)
{
    float tanSquared = (1.0 - dot * dot) / (dot * dot);
    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));
}

float smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)
{
    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);
}

// Trowbridge-Reitz (GGX)
// Generalised Trowbridge-Reitz with gamma power=2.0
float normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)
{
    // Note: alphaG is average slope (gradient) of the normals in slope-space.
    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have
    // a tangent (gradient) closer to the macrosurface than this slope.
    float a2 = Square(alphaG);
    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (kPi * d * d);
}

vec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);
}

vec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)
{
    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);
}

// Cook Torance Specular computation.
vec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)
{
    float alphaG = convertRoughnessToAverageSlope(roughness);
    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);
    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);
    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.

    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));

    float specTerm = max(0., visibility * distribution) * NdotL;
    return fresnel * specTerm * kPi; // TODO: audit pi constants
}

float computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)
{
    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of
    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.
    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);
    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);
    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;
    float diffuseFresnelTerm =
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);


    return diffuseFresnelTerm * NdotL;
    // PI Test
    // diffuseFresnelTerm /= kPi;
}

float adjustRoughnessFromLightProperties(float roughness, float lightRadius, float lightDistance)
{
    // At small angle this approximation works. 
    float lightRoughness = lightRadius / lightDistance;
    // Distribution can sum.
    float totalRoughness = clamp(lightRoughness + roughness, 0., 1.);
    return totalRoughness;
}

float computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)
{
    float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;

    float reflectivityLuminance = getLuminance(reflectivityColor);
    float reflectivityLuma = sqrt(reflectivityLuminance);
    microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;

    return microSurface;
}

vec3 toLinearSpace(vec3 color)
{
    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));
}

vec3 toGammaSpace(vec3 color)
{
    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));
}

float computeLightFalloff(vec3 lightOffset, float lightDistanceSquared, float range)
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        float lightDistanceFalloff = 1.0 / ((lightDistanceSquared + 0.0001));
        return lightDistanceFalloff;
    #else
        float lightFalloff = max(0., 1.0 - length(lightOffset) / range);
        return lightFalloff;
    #endif
}

#ifdef CAMERATONEMAP
    vec3 toneMaps(vec3 color)
    {
        color = max(color, 0.0);

        // TONE MAPPING / EXPOSURE
        color.rgb = color.rgb * vCameraInfos.x;

        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately
        // PI Test
        // tuning *=  kPi;
        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper
        color.rgb = mix(color.rgb, tonemapped, 1.0);
        return color;
    }
#endif

#ifdef CAMERACONTRAST
    vec4 contrasts(vec4 color)
    {
        color = clamp(color, 0.0, 1.0);

        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);
        float contrast = vCameraInfos.y;
        if (contrast < 1.0)
        {
            // Decrease contrast: interpolate towards zero-contrast image (flat grey)
            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);
        }
        else
        {
            // Increase contrast: apply simple shoulder-toe high contrast curve
            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);
        }

        return color;
    }
#endif
// END PBR HELPER METHODS

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

// Light Computing
struct lightingInfo
{
    vec3 diffuse;
#ifdef SPECULARTERM
    vec3 specular;
#endif
};

lightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius, out float NdotL) {
    lightingInfo result;

    vec3 lightDirection;
    float attenuation = 1.0;
    float lightDistance;
    
    // Point
    if (lightData.w == 0.)
    {
        vec3 lightOffset = lightData.xyz - vPositionW;
        float lightDistanceSquared = dot(lightOffset, lightOffset);
        attenuation = computeLightFalloff(lightOffset, lightDistanceSquared, range);
        
        lightDistance = sqrt(lightDistanceSquared);
        lightDirection = normalize(lightOffset);
    }
    // Directional
    else
    {
        lightDistance = length(-lightData.xyz);
        lightDirection = normalize(-lightData.xyz);
    }
    
    // Roughness
    roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
    
    // diffuse
    vec3 H = normalize(viewDirectionW + lightDirection);
    NdotL = max(0.00000000001, dot(vNormal, lightDirection));
    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));

    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
    result.diffuse = diffuseTerm * diffuseColor * attenuation;

#ifdef SPECULARTERM
    // Specular
    float NdotH = max(0.00000000001, dot(vNormal, H));

    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
    result.specular = specTerm * attenuation;
#endif

    return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius, out float NdotL) {
    lightingInfo result;

    vec3 lightOffset = lightData.xyz - vPositionW;
    vec3 lightVectorW = normalize(lightOffset);

    // diffuse
    float cosAngle = max(0.000000000000001, dot(-lightDirection.xyz, lightVectorW));
    
    if (cosAngle >= lightDirection.w)
    {
        cosAngle = max(0., pow(cosAngle, lightData.w));
        
        // Inverse squared falloff.
        float lightDistanceSquared = dot(lightOffset, lightOffset);
        float attenuation = computeLightFalloff(lightOffset, lightDistanceSquared, range);
        
        // Directional falloff.
        attenuation *= cosAngle;
        
        // Roughness.
        float lightDistance = sqrt(lightDistanceSquared);
        roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
        
        // Diffuse
        vec3 H = normalize(viewDirectionW - lightDirection.xyz);
        NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));
        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);

        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);
        result.diffuse = diffuseTerm * diffuseColor * attenuation;

#ifdef SPECULARTERM
        // Specular
        float NdotH = max(0.00000000001, dot(vNormal, H));

        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
        result.specular = specTerm  * attenuation;
#endif

        return result;
    }

    result.diffuse = vec3(0.);
#ifdef SPECULARTERM
    result.specular = vec3(0.);
#endif

    return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV, float lightRadius, out float NdotL) {
    lightingInfo result;

    // Roughness
    // Do not touch roughness on hemispheric.

    // Diffuse
    NdotL = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
    result.diffuse = mix(groundColor, diffuseColor, NdotL);

#ifdef SPECULARTERM
    // Specular
    vec3 lightVectorW = normalize(lightData.xyz);
    vec3 H = normalize(viewDirectionW + lightVectorW);
    float NdotH = max(0.00000000001, dot(vNormal, H));
    NdotL = max(0.00000000001, NdotL);
    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));

    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
    result.specular = specTerm;
#endif

    return result;
}

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

#ifdef LIGHT0
#ifndef SPECULARTERM
    vec3 vLightSpecular0 = vec3(0.0);
#endif
#ifdef SPOTLIGHT0
    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, roughness, NdotV, vLightRadiuses[0], NdotL);
#endif
#ifdef HEMILIGHT0
    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, roughness, NdotV, vLightRadiuses[0], NdotL);
#endif
#if defined(POINTLIGHT0) || defined(DIRLIGHT0)
    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, roughness, NdotV, vLightRadiuses[0], NdotL);
#endif
    notShadowLevel = 1.;
    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
    if (NdotL < 0.000000000011)
    {
        notShadowLevel = 1.;
    }
    shadowedOnlyLightDiffuseContribution *= notShadowLevel;
#endif
#ifdef SPECULARTERM
    lightSpecularContribution += info.specular * notShadowLevel;
#endif
#endif

#ifdef LIGHT1
#ifndef SPECULARTERM
    vec3 vLightSpecular1 = vec3(0.0);
#endif
#ifdef SPOTLIGHT1
    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, roughness, NdotV, vLightRadiuses[1], NdotL);
#endif
#ifdef HEMILIGHT1
    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, roughness, NdotV, vLightRadiuses[1], NdotL);
#endif
#if defined(POINTLIGHT1) || defined(DIRLIGHT1)
    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, roughness, NdotV, vLightRadiuses[1], NdotL);
#endif
    notShadowLevel = 1.;
    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
    if (NdotL < 0.000000000011)
    {
        notShadowLevel = 1.;
    }
    shadowedOnlyLightDiffuseContribution *= notShadowLevel;
#endif

#ifdef SPECULARTERM
    lightSpecularContribution += info.specular * notShadowLevel;
#endif
#endif

#ifdef LIGHT2
#ifndef SPECULARTERM
    vec3 vLightSpecular2 = vec3(0.0);
#endif
#ifdef SPOTLIGHT2
    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, roughness, NdotV, vLightRadiuses[2], NdotL);
#endif
#ifdef HEMILIGHT2
    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, roughness, NdotV, vLightRadiuses[2], NdotL);
#endif
#if defined(POINTLIGHT2) || defined(DIRLIGHT2)
    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, roughness, NdotV, vLightRadiuses[2], NdotL);
#endif
    notShadowLevel = 1.;
    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
    if (NdotL < 0.000000000011)
    {
        notShadowLevel = 1.;
    }
    shadowedOnlyLightDiffuseContribution *= notShadowLevel;
#endif

#ifdef SPECULARTERM
    lightSpecularContribution += info.specular * notShadowLevel;
#endif
#endif

#ifdef LIGHT3
#ifndef SPECULARTERM
    vec3 vLightSpecular3 = vec3(0.0);
#endif
#ifdef SPOTLIGHT3
    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, roughness, NdotV, vLightRadiuses[3], NdotL);
#endif
#ifdef HEMILIGHT3
    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, roughness, NdotV, vLightRadiuses[3], NdotL);
#endif
#if defined(POINTLIGHT3) || defined(DIRLIGHT3)
    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, roughness, NdotV, vLightRadiuses[3], NdotL);
#endif

    notShadowLevel = 1.;
    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
    if (NdotL < 0.000000000011)
    {
        notShadowLevel = 1.;
    }
    shadowedOnlyLightDiffuseContribution *= notShadowLevel;
#endif

#ifdef SPECULARTERM
    lightSpecularContribution += info.specular * notShadowLevel;
#endif
#endif

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