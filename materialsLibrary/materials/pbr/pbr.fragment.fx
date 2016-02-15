﻿#ifdef BUMP
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LODBASEDMICROSFURACE
#extension GL_EXT_shader_texture_lod : enable
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

// Constants
#define RECIPROCAL_PI2 0.15915494
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25

uniform vec3 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec3 vReflectionColor;
uniform vec4 vAlbedoColor;
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

#ifdef USESPHERICALFROMREFLECTIONMAP
    uniform vec3 vSphericalX;
    uniform vec3 vSphericalY;
    uniform vec3 vSphericalZ;
    uniform vec3 vSphericalXX;
    uniform vec3 vSphericalYY;
    uniform vec3 vSphericalZZ;
    uniform vec3 vSphericalXY;
    uniform vec3 vSphericalYZ;
    uniform vec3 vSphericalZX;

    vec3 EnvironmentIrradiance(vec3 normal)
    {
        // Note: 'normal' is assumed to be normalised (or near normalised)
        // This isn't as critical as it is with other calculations (e.g. specular highlight), but the result will be incorrect nonetheless.

        // TODO: switch to optimal implementation
        vec3 result =
            vSphericalX * normal.x +
            vSphericalY * normal.y +
            vSphericalZ * normal.z +
            vSphericalXX * normal.x * normal.x +
            vSphericalYY * normal.y * normal.y +
            vSphericalZZ * normal.z * normal.z +
            vSphericalYZ * normal.y * normal.z +
            vSphericalZX * normal.z * normal.x +
            vSphericalXY * normal.x * normal.y;

        return result.rgb;
    }
#endif

#ifdef LODBASEDMICROSFURACE
    uniform vec2 vMicrosurfaceTextureLods;
#endif

// PBR CUSTOM CONSTANTS
const float kPi = 3.1415926535897932384626433832795;
const float kRougnhessToAlphaScale = 0.1;
const float kRougnhessToAlphaOffset = 0.29248125;

#ifdef PoissonSamplingEnvironment
    const int poissonSphereSamplersCount = 32;
    vec3 poissonSphereSamplers[poissonSphereSamplersCount];

    void initSamplers()
    {
        poissonSphereSamplers[0] = vec3( -0.552198926093, 0.801049753814, -0.0322487480415 );
        poissonSphereSamplers[1] = vec3( 0.344874796559, -0.650989584719, 0.283038477033 ); 
        poissonSphereSamplers[2] = vec3( -0.0710183703467, 0.163770497767, -0.95022416734 ); 
        poissonSphereSamplers[3] = vec3( 0.422221832073, 0.576613638193, 0.519157625948 ); 
        poissonSphereSamplers[4] = vec3( -0.561872200916, -0.665581249881, -0.131630473211 ); 
        poissonSphereSamplers[5] = vec3( -0.409905973809, 0.0250731510778, 0.674676954809 ); 
        poissonSphereSamplers[6] = vec3( 0.206829570551, -0.190199352704, 0.919073906156 ); 
        poissonSphereSamplers[7] = vec3( -0.857514664463, 0.0274425010091, -0.475068738967 ); 
        poissonSphereSamplers[8] = vec3( -0.816275009951, -0.0432916479141, 0.40394579291 ); 
        poissonSphereSamplers[9] = vec3( 0.397976181928, -0.633227519667, -0.617794410447 ); 
        poissonSphereSamplers[10] = vec3( -0.181484199014, 0.0155418272003, -0.34675720703 ); 
        poissonSphereSamplers[11] = vec3( 0.591734926919, 0.489930882201, -0.51675303188 ); 
        poissonSphereSamplers[12] = vec3( -0.264514973057, 0.834248662136, 0.464624235985 ); 
        poissonSphereSamplers[13] = vec3( -0.125845223505, 0.812029586099, -0.46213797731 ); 
        poissonSphereSamplers[14] = vec3( 0.0345715424639, 0.349983742938, 0.855109899027 ); 
        poissonSphereSamplers[15] = vec3( 0.694340492749, -0.281052190209, -0.379600605543 ); 
        poissonSphereSamplers[16] = vec3( -0.241055518078, -0.580199280578, 0.435381168431 );
        poissonSphereSamplers[17] = vec3( 0.126313722289, 0.715113642744, 0.124385788055 ); 
        poissonSphereSamplers[18] = vec3( 0.752862552387, 0.277075021888, 0.275059597549 );
        poissonSphereSamplers[19] = vec3( -0.400896300918, -0.309374534321, -0.74285782627 ); 
        poissonSphereSamplers[20] = vec3( 0.121843331941, -0.00381197918195, 0.322441835258 ); 
        poissonSphereSamplers[21] = vec3( 0.741656771351, -0.472083016745, 0.14589173819 ); 
        poissonSphereSamplers[22] = vec3( -0.120347565985, -0.397252703556, -0.00153836114051 ); 
        poissonSphereSamplers[23] = vec3( -0.846258835203, -0.433763808754, 0.168732209784 ); 
        poissonSphereSamplers[24] = vec3( 0.257765618362, -0.546470581239, -0.242234375624 ); 
        poissonSphereSamplers[25] = vec3( -0.640343473361, 0.51920903395, 0.549310644325 ); 
        poissonSphereSamplers[26] = vec3( -0.894309984621, 0.297394061018, 0.0884583225292 ); 
        poissonSphereSamplers[27] = vec3( -0.126241933628, -0.535151016335, -0.440093659672 ); 
        poissonSphereSamplers[28] = vec3( -0.158176440297, -0.393125021578, 0.890727226039 ); 
        poissonSphereSamplers[29] = vec3( 0.896024272938, 0.203068725821, -0.11198597748 ); 
        poissonSphereSamplers[30] = vec3( 0.568671758933, -0.314144243629, 0.509070768816 ); 
        poissonSphereSamplers[31] = vec3( 0.289665332178, 0.104356977462, -0.348379247171 );
    }

    vec3 environmentSampler(samplerCube cubeMapSampler, vec3 centralDirection, float microsurfaceAverageSlope)
    {
        vec3 result = vec3(0., 0., 0.);
        for(int i = 0; i < poissonSphereSamplersCount; i++)
        {
            vec3 offset = poissonSphereSamplers[i];
            vec3 direction = centralDirection + microsurfaceAverageSlope * offset;
            result += textureCube(cubeMapSampler, direction, 0.).rgb;
        }

        result /= 32.0;
        return result;
    }

#endif

// PBR HELPER METHODS
float Square(float value)
{
    return value * value;
}

float getLuminance(vec3 color)
{
    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);
}

float convertRoughnessToAverageSlope(float roughness)
{
    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues
    const float kMinimumVariance = 0.0005;
    float alphaG = Square(roughness) + kMinimumVariance;
    return alphaG;
}

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
#include<light0FragmentDeclaration>
#include<light1FragmentDeclaration>
#include<light2FragmentDeclaration>
#include<light3FragmentDeclaration>

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

// Fresnel
#ifdef FRESNEL
float computeFresnelTerm(vec3 viewDirection, vec3 worldNormal, float bias, float power)
{
    float fresnelTerm = pow(bias + abs(dot(viewDirection, worldNormal)), power);
    return clamp(fresnelTerm, 0., 1.);
}
#endif

#ifdef OPACITYFRESNEL
uniform vec4 opacityParts;
#endif

#ifdef EMISSIVEFRESNEL
uniform vec4 emissiveLeftColor;
uniform vec4 emissiveRightColor;
#endif

// Refraction Reflection
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
    uniform mat4 view;
#endif

// Refraction
#ifdef REFRACTION
    uniform vec4 vRefractionInfos;

    #ifdef REFRACTIONMAP_3D
        uniform samplerCube refractionCubeSampler;
    #else
        uniform sampler2D refraction2DSampler;
        uniform mat4 refractionMatrix;
    #endif
#endif

// Reflection
#ifdef REFLECTION
uniform vec2 vReflectionInfos;

#ifdef REFLECTIONMAP_3D
uniform samplerCube reflectionCubeSampler;
#else
uniform sampler2D reflection2DSampler;
#endif

#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
    #ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
    varying vec3 vDirectionW;
    #endif

    #if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)
    uniform mat4 reflectionMatrix;
    #endif
#endif

vec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)
{
#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
    vec3 direction = normalize(vDirectionW);

    float t = clamp(direction.y * -0.5 + 0.5, 0., 1.0);
    float s = atan(direction.z, direction.x) * RECIPROCAL_PI2 + 0.5;

    return vec3(s, t, 0);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR

	vec3 cameraToVertex = normalize(worldPos.xyz - vEyePosition);
	vec3 r = reflect(cameraToVertex, worldNormal);
	float t = clamp(r.y * -0.5 + 0.5, 0., 1.0);
	float s = atan(r.z, r.x) * RECIPROCAL_PI2 + 0.5;

	return vec3(s, t, 0);
#endif

#ifdef REFLECTIONMAP_SPHERICAL
    vec3 viewDir = normalize(vec3(view * worldPos));
    vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));

    vec3 r = reflect(viewDir, viewNormal);
    r.z = r.z - 1.0;

    float m = 2.0 * length(r);

    return vec3(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);
#endif

#ifdef REFLECTIONMAP_PLANAR
    vec3 viewDir = worldPos.xyz - vEyePosition;
    vec3 coords = normalize(reflect(viewDir, worldNormal));

    return vec3(reflectionMatrix * vec4(coords, 1));
#endif

#ifdef REFLECTIONMAP_CUBIC
    vec3 viewDir = worldPos.xyz - vEyePosition;
    vec3 coords = reflect(viewDir, worldNormal);
#ifdef INVERTCUBICMAP
    coords.y = 1.0 - coords.y;
#endif
    return vec3(reflectionMatrix * vec4(coords, 0));
#endif

#ifdef REFLECTIONMAP_PROJECTION
    return vec3(reflectionMatrix * (view * worldPos));
#endif

#ifdef REFLECTIONMAP_SKYBOX
    return vPositionUVW;
#endif

#ifdef REFLECTIONMAP_EXPLICIT
    return vec3(0, 0, 0);
#endif
}

#endif

// Shadows
#ifdef SHADOWS

float unpack(vec4 color)
{
    const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
    return dot(color, bit_shift);
}

#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)
uniform vec2 depthValues;

float computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)
{
	vec3 directionToLight = vPositionW - lightPosition;
	float depth = length(directionToLight);
	depth = clamp(depth, 0., 1.0);

	directionToLight = normalize(directionToLight);
	directionToLight.y = - directionToLight.y;

	float shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;

    if (depth > shadow)
    {
#ifdef OVERLOADEDSHADOWVALUES
        return mix(1.0, darkness, vOverloadedShadowIntensity.x);
#else
        return darkness;
#endif
    }
    return 1.0;
}

float computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)
{
    vec3 directionToLight = vPositionW - lightPosition;
    float depth = length(directionToLight);

    depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
    depth = clamp(depth, 0., 1.0);

    directionToLight = normalize(directionToLight);
    directionToLight.y = -directionToLight.y;

    float visibility = 1.;

    vec3 poissonDisk[4];
    poissonDisk[0] = vec3(-1.0, 1.0, -1.0);
    poissonDisk[1] = vec3(1.0, -1.0, -1.0);
    poissonDisk[2] = vec3(-1.0, -1.0, -1.0);
    poissonDisk[3] = vec3(1.0, -1.0, 1.0);

    // Poisson Sampling
    float biasedDepth = depth - bias;

    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;
    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;
    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;
    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;

#ifdef OVERLOADEDSHADOWVALUES
    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));
#else
    return  min(1.0, visibility + darkness);
#endif
}
#endif

#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)
float computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)
{
    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
    depth = 0.5 * depth + vec3(0.5);
    vec2 uv = depth.xy;

    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
    {
        return 1.0;
    }

    float shadow = unpack(texture2D(shadowSampler, uv)) + bias;

    if (depth.z > shadow)
    {
#ifdef OVERLOADEDSHADOWVALUES
        return mix(1.0, darkness, vOverloadedShadowIntensity.x);
#else
        return darkness;
#endif
    }
    return 1.;
}

float computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)
{
    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
    depth = 0.5 * depth + vec3(0.5);
    vec2 uv = depth.xy;

    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
    {
        return 1.0;
    }

    float visibility = 1.;

    vec2 poissonDisk[4];
    poissonDisk[0] = vec2(-0.94201624, -0.39906216);
    poissonDisk[1] = vec2(0.94558609, -0.76890725);
    poissonDisk[2] = vec2(-0.094184101, -0.92938870);
    poissonDisk[3] = vec2(0.34495938, 0.29387760);

    // Poisson Sampling
    float biasedDepth = depth.z - bias;

    if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;
    if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;
    if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;
    if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;

#ifdef OVERLOADEDSHADOWVALUES
    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));
#else
    return  min(1.0, visibility + darkness);
#endif
}

// Thanks to http://devmaster.net/
float unpackHalf(vec2 color)
{
    return color.x + (color.y / 255.0);
}

float linstep(float low, float high, float v) {
    return clamp((v - low) / (high - low), 0.0, 1.0);
}

float ChebychevInequality(vec2 moments, float compare, float bias)
{
    float p = smoothstep(compare - bias, compare, moments.x);
    float variance = max(moments.y - moments.x * moments.x, 0.02);
    float d = compare - moments.x;
    float p_max = linstep(0.2, 1.0, variance / (variance + d * d));

    return clamp(max(p, p_max), 0.0, 1.0);
}

float computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)
{
    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
    depth = 0.5 * depth + vec3(0.5);
    vec2 uv = depth.xy;

    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)
    {
        return 1.0;
    }

    vec4 texel = texture2D(shadowSampler, uv);

    vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));
#ifdef OVERLOADEDSHADOWVALUES
    return min(1.0, mix(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness, vOverloadedShadowIntensity.x));
#else
    return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);
#endif
}
#endif

#endif

#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

// Light Computing
struct lightingInfo
{
    vec3 diffuse;
#ifdef SPECULARTERM
    vec3 specular;
#endif
};

lightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius) {
    lightingInfo result;

    vec3 lightDirection;
    float attenuation = 1.0;
    float lightDistance;
    
    // Point
    if (lightData.w == 0.)
    {
        vec3 lightOffset = lightData.xyz - vPositionW;
        
        // Inverse squared falloff.
        float lightDistanceSquared = dot(lightOffset, lightOffset);
        float lightDistanceFalloff = 1.0 / ((lightDistanceSquared + 0.0001) * range);
        attenuation = lightDistanceFalloff;
        
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
    float NdotL = max(0.00000000001, dot(vNormal, lightDirection));
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

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius) {
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
        float lightDistanceFalloff = 1.0 / ((lightDistanceSquared + 0.0001) * range);
        float attenuation = lightDistanceFalloff;
        
        // Directional falloff.
        attenuation *= cosAngle;
        
        // Roughness.
        float lightDistance = sqrt(lightDistanceSquared);
        roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);
        
        // Diffuse
        vec3 H = normalize(viewDirectionW - lightDirection.xyz);
        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));
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

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV, float lightRadius) {
    lightingInfo result;

    // Roughness
    // Do not touch roughness on hemispheric.

    // Diffuse
    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
    result.diffuse = mix(groundColor, diffuseColor, ndl);

#ifdef SPECULARTERM
    // Specular
    vec3 lightVectorW = normalize(lightData.xyz);
    vec3 H = normalize(viewDirectionW + lightVectorW);
    float NdotH = max(0.00000000001, dot(vNormal, H));
    float NdotL = max(0.00000000001, ndl);
    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));

    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);
    result.specular = specTerm;
#endif

    return result;
}

void main(void) {
#include<clipPlaneFragment>

    #ifdef PoissonSamplingEnvironment
        initSamplers();
    #endif

    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

    // Albedo
    vec4 surfaceAlbedo = vec4(1., 1., 1., 1.);
    vec3 surfaceAlbedoContribution = vAlbedoColor.rgb;
    
    // Alpha
    float alpha = vAlbedoColor.a;

    #ifdef ALBEDO
        surfaceAlbedo = texture2D(albedoSampler, vAlbedoUV);
        surfaceAlbedo = vec4(toLinearSpace(surfaceAlbedo.rgb), surfaceAlbedo.a);

        #ifndef LINKREFRACTIONTOTRANSPARENCY
            #ifdef ALPHATEST
                if (surfaceAlbedo.a < 0.4)
                    discard;
            #endif
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
        surfaceAlbedo.rgb *= vColor.rgb;
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


    #ifdef BUMP
        normalW = perturbNormal(viewDirectionW);
    #endif

    // Ambient color
    vec3 ambientColor = vec3(1., 1., 1.);

    #ifdef AMBIENT
        ambientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;
        
        #ifdef OVERLOADEDVALUES
            ambientColor.rgb = mix(ambientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);
        #endif
    #endif

    // Specular map
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

#ifdef LIGHT0
#ifndef SPECULARTERM
    vec3 vLightSpecular0 = vec3(0.0);
#endif
#ifdef SPOTLIGHT0
    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, roughness, NdotV, vLightRadiuses[0]);
#endif
#ifdef HEMILIGHT0
    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, roughness, NdotV, vLightRadiuses[0]);
#endif
#if defined(POINTLIGHT0) || defined(DIRLIGHT0)
    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, roughness, NdotV, vLightRadiuses[0]);
#endif
#ifdef SHADOW0
#ifdef SHADOWVSM0
    notShadowLevel = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);
#else
#ifdef SHADOWPCF0
#if defined(POINTLIGHT0)
    notShadowLevel = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);
#else
    notShadowLevel = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);
#endif
#else
#if defined(POINTLIGHT0)
    notShadowLevel = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);
#else
    notShadowLevel = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);
#endif
#endif
#endif
#else
    notShadowLevel = 1.;
#endif
    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
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
    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, roughness, NdotV, vLightRadiuses[1]);
#endif
#ifdef HEMILIGHT1
    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, roughness, NdotV, vLightRadiuses[1]);
#endif
#if defined(POINTLIGHT1) || defined(DIRLIGHT1)
    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, roughness, NdotV, vLightRadiuses[1]);
#endif
#ifdef SHADOW1
#ifdef SHADOWVSM1
    notShadowLevel = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);
#else
#ifdef SHADOWPCF1
#if defined(POINTLIGHT1)
    notShadowLevel = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);
#else
    notShadowLevel = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);
#endif
#else
#if defined(POINTLIGHT1)
    notShadowLevel = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);
#else
    notShadowLevel = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);
#endif
#endif
#endif
#else
    notShadowLevel = 1.;
#endif

    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
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
    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, roughness, NdotV, vLightRadiuses[2]);
#endif
#ifdef HEMILIGHT2
    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, roughness, NdotV, vLightRadiuses[2]);
#endif
#if defined(POINTLIGHT2) || defined(DIRLIGHT2)
    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, roughness, NdotV, vLightRadiuses[2]);
#endif
#ifdef SHADOW2
#ifdef SHADOWVSM2
    notShadowLevel = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);
#else
#ifdef SHADOWPCF2
#if defined(POINTLIGHT2)
    notShadowLevel = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);
#else
    notShadowLevel = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);
#endif
#else
#if defined(POINTLIGHT2)
    notShadowLevel = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);
#else
    notShadowLevel = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);
#endif
#endif	
#endif	
#else
    notShadowLevel = 1.;
#endif

    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
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
    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, roughness, NdotV, vLightRadiuses[3]);
#endif
#ifdef HEMILIGHT3
    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, roughness, NdotV, vLightRadiuses[3]);
#endif
#if defined(POINTLIGHT3) || defined(DIRLIGHT3)
    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, roughness, NdotV, vLightRadiuses[3]);
#endif
#ifdef SHADOW3
#ifdef SHADOWVSM3
    notShadowLevel = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);
#else
#ifdef SHADOWPCF3
#if defined(POINTLIGHT3)
    notShadowLevel = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);
#else
    notShadowLevel = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);
#endif
#else
#if defined(POINTLIGHT3)
    notShadowLevel = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);
#else
    notShadowLevel = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);
#endif
#endif	
#endif	
#else
    notShadowLevel = 1.;
#endif

    lightDiffuseContribution += info.diffuse * notShadowLevel;
#ifdef OVERLOADEDSHADOWVALUES
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

#ifdef OPACITYFRESNEL
    float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);

    alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;
#endif

// Refraction
vec3 surfaceRefractionColor = vec3(0., 0., 0.);

// Go mat -> blurry reflexion according to microSurface
#ifndef LODBASEDMICROSFURACE
    float bias = 20. * (1.0 - microSurface);
#else
    float alphaG = convertRoughnessToAverageSlope(roughness);
#endif
        
#ifdef REFRACTION
	vec3 refractionVector = normalize(refract(-viewDirectionW, normalW, vRefractionInfos.y));
    
    #ifdef LODBASEDMICROSFURACE
        float lodRefraction = getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.y, alphaG);
    #endif
    
    #ifdef REFRACTIONMAP_3D
        refractionVector.y = refractionVector.y * vRefractionInfos.w;

        if (dot(refractionVector, viewDirectionW) < 1.0)
        {
            #ifdef LODBASEDMICROSFURACE
                surfaceRefractionColor = textureCubeLodEXT(refractionCubeSampler, refractionVector, lodRefraction).rgb * vRefractionInfos.x;
            #else
                surfaceRefractionColor = textureCube(refractionCubeSampler, refractionVector, bias).rgb * vRefractionInfos.x;
            #endif
        }
        
        #ifndef REFRACTIONMAPINLINEARSPACE
            surfaceRefractionColor = toLinearSpace(surfaceRefractionColor.rgb); 
        #endif
    #else
        vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));

        vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;

        refractionCoords.y = 1.0 - refractionCoords.y;

        #ifdef LODBASEDMICROSFURACE
            surfaceRefractionColor = texture2DLodEXT(refraction2DSampler, refractionCoords, lodRefraction).rgb * vRefractionInfos.x;
        #else
            surfaceRefractionColor = texture2D(refraction2DSampler, refractionCoords).rgb * vRefractionInfos.x;
        #endif    
        
        surfaceRefractionColor = toLinearSpace(surfaceRefractionColor.rgb); 
    #endif
#endif

// Reflection
vec3 environmentRadiance = vReflectionColor.rgb;
vec3 environmentIrradiance = vReflectionColor.rgb;

#ifdef REFLECTION
    vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);

    #ifdef LODBASEDMICROSFURACE
        float lodReflection = getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.x, alphaG);
    #endif
    
    #ifdef REFLECTIONMAP_3D
        
        #ifdef LODBASEDMICROSFURACE
            environmentRadiance = textureCubeLodEXT(reflectionCubeSampler, vReflectionUVW, lodReflection).rgb * vReflectionInfos.x;
        #else
            environmentRadiance = textureCube(reflectionCubeSampler, vReflectionUVW, bias).rgb * vReflectionInfos.x;
        #endif
        
        #ifdef PoissonSamplingEnvironment
            environmentRadiance = environmentSampler(reflectionCubeSampler, vReflectionUVW, alphaG) * vReflectionInfos.x;
        #endif

        #ifdef USESPHERICALFROMREFLECTIONMAP
            #ifndef REFLECTIONMAP_SKYBOX
                vec3 normalEnvironmentSpace = (reflectionMatrix * vec4(normalW, 1)).xyz;
                environmentIrradiance = EnvironmentIrradiance(normalEnvironmentSpace);
            #endif
        #else
            environmentRadiance = toLinearSpace(environmentRadiance.rgb);
            
            environmentIrradiance = textureCube(reflectionCubeSampler, normalW, 20.).rgb * vReflectionInfos.x;
            environmentIrradiance = toLinearSpace(environmentIrradiance.rgb);
            environmentIrradiance *= 0.2; // Hack in case of no hdr cube map use for environment.
        #endif
    #else
        vec2 coords = vReflectionUVW.xy;

        #ifdef REFLECTIONMAP_PROJECTION
            coords /= vReflectionUVW.z;
        #endif

        coords.y = 1.0 - coords.y;
        #ifdef LODBASEDMICROSFURACE
            environmentRadiance = texture2DLodExt(reflection2DSampler, coords, lodReflection).rgb * vReflectionInfos.x;
        #else
            environmentRadiance = texture2D(reflection2DSampler, coords).rgb * vReflectionInfos.x;
        #endif
    
        environmentRadiance = toLinearSpace(environmentRadiance.rgb);

        environmentIrradiance = texture2D(reflection2DSampler, coords, 20.).rgb * vReflectionInfos.x;
        environmentIrradiance = toLinearSpace(environmentIrradiance.rgb);
    #endif
#endif

#ifdef OVERLOADEDVALUES
    environmentIrradiance = mix(environmentIrradiance, vOverloadedReflection, vOverloadedMicroSurface.z);
    environmentRadiance = mix(environmentRadiance, vOverloadedReflection, vOverloadedMicroSurface.z);
#endif

environmentRadiance *= vLightingIntensity.z;
environmentIrradiance *= vLightingIntensity.z;

// Compute reflection specular fresnel
vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);
vec3 specularEnvironmentReflectance = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));

// Compute refractance
vec3 refractance = vec3(0.0 , 0.0, 0.0);
#ifdef REFRACTION
    vec3 transmission = vec3(1.0 , 1.0, 1.0);
    #ifdef LINKREFRACTIONTOTRANSPARENCY
        // Transmission based on alpha.
        transmission *= (1.0 - alpha);
        
        // Tint the material with albedo.
        // TODO. PBR Tinting.
        vec3 mixedAlbedo = surfaceAlbedoContribution.rgb * surfaceAlbedo.rgb;
        float maxChannel = max(max(mixedAlbedo.r, mixedAlbedo.g), mixedAlbedo.b);
        vec3 tint = clamp(maxChannel * mixedAlbedo, 0.0, 1.0);
        
        // Decrease Albedo Contribution
        surfaceAlbedoContribution *= alpha;
        
        // Decrease irradiance Contribution
        environmentIrradiance *= alpha;
        
        // Tint reflectance
        surfaceRefractionColor *= tint;
        
        // Put alpha back to 1;
        alpha = 1.0;
    #endif
    
    // Add Multiple internal bounces.
    vec3 bounceSpecularEnvironmentReflectance = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);
    specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, alpha);
    
    // In theory T = 1 - R.
    transmission *= 1.0 - specularEnvironmentReflectance;
    
    // Should baked in diffuse.
    refractance = surfaceRefractionColor * transmission;
#endif

// Apply Energy Conservation taking in account the environment level only if the environment is present.
float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);
surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;

refractance *= vLightingIntensity.z;
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

#ifdef EMISSIVEFRESNEL
    float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);

    surfaceEmissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;
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

#ifdef OVERLOADEDSHADOWVALUES
    finalSpecular = mix(finalSpecular, vec3(0.0), (1.0 - vOverloadedShadowIntensity.y));
#endif

#ifdef SPECULAROVERALPHA
    alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);
#endif

// Composition
// Reflection already includes the environment intensity.
#ifdef EMISSIVEASILLUMINATION
    vec4 finalColor = vec4(finalDiffuse * ambientColor * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance + finalSpecular * vLightingIntensity.x + environmentRadiance + surfaceEmissiveColor * vLightingIntensity.y + refractance, alpha);
#else
    vec4 finalColor = vec4(finalDiffuse * ambientColor * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance + finalSpecular * vLightingIntensity.x + environmentRadiance + refractance, alpha);
#endif

#ifdef LIGHTMAP
    vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV).rgb * vLightmapInfos.y;

    #ifdef USELIGHTMAPASSHADOWMAP
        finalColor.rgb *= lightmapColor;
    #else
        finalColor.rgb += lightmapColor;
    #endif
#endif

    finalColor = max(finalColor, 0.0);

#ifdef CAMERATONEMAP
    finalColor.rgb = toneMaps(finalColor.rgb);
#endif

    finalColor.rgb = toGammaSpace(finalColor.rgb);

#ifdef CAMERACONTRAST
    finalColor = contrasts(finalColor);
#endif

    // Normal Display.
    // gl_FragColor = vec4(normalW * 0.5 + 0.5, 1.0);

    // Ambient reflection color.
    // gl_FragColor = vec4(ambientReflectionColor, 1.0);

    // Reflection color.
    // gl_FragColor = vec4(reflectionColor, 1.0);

    // Base color.
    // gl_FragColor = vec4(surfaceAlbedo.rgb, 1.0);

    // Specular color.
    // gl_FragColor = vec4(surfaceReflectivityColor.rgb, 1.0);

    // MicroSurface color.
    // gl_FragColor = vec4(microSurface, microSurface, microSurface, 1.0);

    // Specular Map
    // gl_FragColor = vec4(reflectivityMapColor.rgb, 1.0);
    
    // Refractance
    // gl_FragColor = vec4(refractance.rgb, 1.0);

    //// Emissive Color
    //vec2 test = vEmissiveUV * 0.5 + 0.5;
    //gl_FragColor = vec4(test.x, test.y, 1.0, 1.0);

#include<logDepthFragment>
#include<fogFragment>(color, finalColor)

    gl_FragColor = finalColor;
}