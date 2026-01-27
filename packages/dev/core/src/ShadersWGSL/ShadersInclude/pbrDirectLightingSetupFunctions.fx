// Pre Light Computing
struct preLightingInfo
{
    // Pre Falloff Info
    lightOffset: vec3f,
    lightDistanceSquared: f32,
    lightDistance: f32,

    // Falloff Info
    attenuation: f32,

    // Lighting Info
    L: vec3f,
    H: vec3f,
    NdotV: f32,
    NdotLUnclamped: f32,
    NdotL: f32,
    VdotH: f32,
    LdotV: f32,
    
    roughness: f32,
    diffuseRoughness: f32,
    surfaceAlbedo: vec3f,

    #ifdef IRIDESCENCE
        iridescenceIntensity: f32
    #endif

    #if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
    areaLightDiffuse: vec3f,
        #ifdef SPECULARTERM
            areaLightSpecular: vec3f,
            areaLightFresnel: vec4f
        #endif
    #endif
};

fn computePointAndSpotPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f, posW: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

    // Attenuation data.
    result.lightOffset = lightData.xyz - posW;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);

    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

    // Geometry Data.
    result.L = normalize(result.lightOffset);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);

    return result;
}

fn computeDirectionalPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

    // Roughness
    result.lightDistance = length(-lightData.xyz);

    // Geometry Data.
    result.L = normalize(-lightData.xyz);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);
    result.LdotV = dot(result.L, V);
    return result;
}

fn computeHemisphericPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

    // Geometry Data.
    // Half Lambert for Hemispherix lighting.
    result.NdotL = dot(N, lightData.xyz) * 0.5 + 0.5;
    result.NdotL = saturateEps(result.NdotL);
    result.NdotLUnclamped = result.NdotL;

    #ifdef SPECULARTERM
        result.L = normalize(lightData.xyz);
        result.H = normalize(V + result.L);
        result.VdotH = saturate(dot(V, result.H));
    #endif

    return result;
}

#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>

var areaLightsLTC1SamplerSampler: sampler;
var areaLightsLTC1Sampler: texture_2d<f32>;
var areaLightsLTC2SamplerSampler: sampler;
var areaLightsLTC2Sampler: texture_2d<f32>;

fn computeAreaPreLightingInfo(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, viewDirectionW: vec3f, vNormal:vec3f, vPosition:vec3f, lightCenter:vec3f, halfWidth:vec3f,  halfHeight:vec3f, roughness:f32) -> preLightingInfo {
    var result: preLightingInfo;
	var data: areaLightData = computeAreaLightSpecularDiffuseFresnel(ltc1, ltc1Sampler, ltc2, ltc2Sampler, viewDirectionW, vNormal, vPosition, lightCenter, halfWidth, halfHeight, roughness);

#ifdef SPECULARTERM
    result.areaLightFresnel = data.Fresnel;
    result.areaLightSpecular = data.Specular;
#endif
	result.areaLightDiffuse += data.Diffuse;
    return result;
}

fn computeAreaPreLightingInfoWithTexture(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, emissionTexture:texture_2d<f32>, emissionTextureSampler:sampler, viewDirectionW: vec3f, vNormal:vec3f, vPosition:vec3f, lightCenter:vec3f, halfWidth:vec3f,  halfHeight:vec3f, roughness:f32) -> preLightingInfo {
    var result: preLightingInfo;
    result.lightOffset = lightCenter - vPosition;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);
    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

    var data: areaLightData = computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1, ltc1Sampler, ltc2, ltc2Sampler, emissionTexture, emissionTextureSampler, viewDirectionW, vNormal, vPosition, lightCenter, halfWidth, halfHeight, roughness);
    #ifdef SPECULARTERM
    result.areaLightFresnel = data.Fresnel;
    result.areaLightSpecular = data.Specular;
    #endif
    result.areaLightDiffuse = data.Diffuse;

    result.LdotV = 0.;
    result.roughness = 0.;
    result.diffuseRoughness = 0.;
    result.surfaceAlbedo = vec3f(0.);
    return result;
}

#endif