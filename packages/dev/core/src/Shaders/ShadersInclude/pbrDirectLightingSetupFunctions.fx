// Pre Light Computing
struct preLightingInfo
{
    // Pre Falloff Info
    vec3 lightOffset;
    float lightDistanceSquared;
    float lightDistance;

    // Falloff Info
    float attenuation;

    // Lighting Info
    vec3 L;
    vec3 H;
    float NdotV;
    float NdotLUnclamped;
    float NdotL;
    float VdotH;
    float LdotV;

     // TODO: the code would probably be leaner with material properties out of the structure.
    float roughness;
    float diffuseRoughness;
    vec3 surfaceAlbedo;

    #ifdef IRIDESCENCE
        float iridescenceIntensity;
    #endif

    #if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        vec3 areaLightDiffuse;

        #ifdef SPECULARTERM
            vec3 areaLightSpecular;
            vec4 areaLightFresnel;
        #endif
    #endif
};

preLightingInfo computePointAndSpotPreLightingInfo(vec4 lightData, vec3 V, vec3 N, vec3 posW) {
    preLightingInfo result;

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

    result.LdotV = 0.;
    result.roughness = 0.;
    result.diffuseRoughness = 0.;
    result.surfaceAlbedo = vec3(0.);
    return result;
}

preLightingInfo computeDirectionalPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

    // Roughness
    result.lightDistance = length(-lightData.xyz);

    // Geometry Data.
    result.L = normalize(-lightData.xyz);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);
    result.LdotV = dot(result.L, V);

    result.roughness = 0.;
    result.diffuseRoughness = 0.;
    result.surfaceAlbedo = vec3(0.);
    return result;
}

preLightingInfo computeHemisphericPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

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
    result.LdotV = 0.;
    result.roughness = 0.;
    result.diffuseRoughness = 0.;
    result.surfaceAlbedo = vec3(0.);
    return result;
}

#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>

uniform sampler2D areaLightsLTC1Sampler;
uniform sampler2D areaLightsLTC2Sampler;

preLightingInfo computeAreaPreLightingInfo(sampler2D ltc1, sampler2D ltc2, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec4 lightData, vec3 halfWidth, vec3 halfHeight, float roughness )
{
	preLightingInfo result;
    result.lightOffset = lightData.xyz - vPosition;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);
    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

	areaLightData data = computeAreaLightSpecularDiffuseFresnel(ltc1, ltc2, viewDirectionW, vNormal, vPosition, lightData.xyz, halfWidth, halfHeight, roughness);

#ifdef SPECULARTERM
    result.areaLightFresnel = data.Fresnel;
    result.areaLightSpecular = data.Specular;
#endif
	result.areaLightDiffuse = data.Diffuse;

    result.LdotV = 0.;
    result.roughness = 0.;
    result.diffuseRoughness = 0.;
    result.surfaceAlbedo = vec3(0.);
	return result;
}

preLightingInfo computeAreaPreLightingInfoWithTexture(sampler2D ltc1, sampler2D ltc2, sampler2D emissionTexture, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec4 lightData, vec3 halfWidth, vec3 halfHeight, float roughness )
{
	preLightingInfo result;
    result.lightOffset = lightData.xyz - vPosition;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);
    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

	areaLightData data = computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1, ltc2, emissionTexture, viewDirectionW, vNormal, vPosition, lightData.xyz, halfWidth, halfHeight, roughness);
#ifdef SPECULARTERM
    result.areaLightFresnel = data.Fresnel;
    result.areaLightSpecular = data.Specular;
#endif
	result.areaLightDiffuse = data.Diffuse;

    result.LdotV = 0.;
    result.roughness = 0.;
    result.diffuseRoughness = 0.;
    result.surfaceAlbedo = vec3(0.);
	return result;
}

#endif