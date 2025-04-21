#define CLEARCOATREFLECTANCE90 1.0

// Light Results
struct lightingInfo
{
    vec3 diffuse;
    #ifdef SS_TRANSLUCENCY
        vec3 diffuseTransmission;
    #endif
    #ifdef SPECULARTERM
        vec3 specular;
    #endif
    #ifdef CLEARCOAT
        // xyz contains the clearcoat color.
        // w contains the 1 - clearcoat fresnel to ease the energy conservation computation.
        vec4 clearCoat;
    #endif
    #ifdef SHEEN
        vec3 sheen;
    #endif
};

// Simulate area (small) lights by increasing roughness
float adjustRoughnessFromLightProperties(float roughness, float lightRadius, float lightDistance) {
    #if defined(USEPHYSICALLIGHTFALLOFF) || defined(USEGLTFLIGHTFALLOFF)
        // At small angle this approximation works. 
        float lightRoughness = lightRadius / lightDistance;
        // Distribution can sum.
        float totalRoughness = saturate(lightRoughness + roughness);
        return totalRoughness;
    #else
        return roughness;
    #endif
}

vec3 computeHemisphericDiffuseLighting(preLightingInfo info, vec3 lightColor, vec3 groundColor) {
    return mix(groundColor, lightColor, info.NdotL);
}

#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
    vec3 computeAreaDiffuseLighting(preLightingInfo info, vec3 lightColor) {
        return info.areaLightDiffuse * lightColor;
    }
#endif

vec3 computeDiffuseLighting(preLightingInfo info, vec3 lightColor) {
    float diffuseTerm = diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.roughness);
    return diffuseTerm * info.attenuation * info.NdotL * lightColor;
}

#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler, mat4 textureProjectionMatrix, vec3 posW){
    vec4 strq = textureProjectionMatrix * vec4(posW, 1.0);
    strq /= strq.w;
    vec3 textureColor = texture2D(projectionLightSampler, strq.xy).rgb;
    return toLinearSpace(textureColor);
}

#ifdef SS_TRANSLUCENCY
    vec3 computeDiffuseTransmittedLighting(preLightingInfo info, vec3 lightColor, vec3 transmittance) {
        vec3 transmittanceNdotL = vec3(0.);
        float NdotL = absEps(info.NdotLUnclamped);
    #ifndef SS_TRANSLUCENCY_LEGACY
        if (info.NdotLUnclamped < 0.0) {
    #endif
            // Use wrap lighting to simulate SSS.
            float wrapNdotL = computeWrappedDiffuseNdotL(NdotL, 0.02);

            // Remap transmittance from tr to 1. if ndotl is negative.
            float trAdapt = step(0., info.NdotLUnclamped);
            transmittanceNdotL = mix(transmittance * wrapNdotL, vec3(wrapNdotL), trAdapt);
    #ifndef SS_TRANSLUCENCY_LEGACY
        }

        return (transmittanceNdotL / PI) * info.attenuation * lightColor;
    #endif

        float diffuseTerm = diffuseBRDF_Burley(NdotL, info.NdotV, info.VdotH, info.roughness);
        return diffuseTerm * transmittanceNdotL * info.attenuation * lightColor;
    }
#endif

#ifdef SPECULARTERM
    vec3 computeSpecularLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor, float ior) {
        float NdotH = saturateEps(dot(N, info.H));
        float roughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(roughness);

        #ifdef METALLICWORKFLOW
            // Scale the reflectance by the IOR for values less than 1.5
            reflectance90 = clamp(reflectance90 * 2.0 * (ior - 1.0), 0.0, 1.0);
        #endif
        vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);

        #ifdef BRDF_V_HEIGHT_CORRELATED
            float smithVisibility = smithVisibility_GGXCorrelated(info.NdotL, info.NdotV, alphaG);
        #else
            float smithVisibility = smithVisibility_TrowbridgeReitzGGXFast(info.NdotL, info.NdotV, alphaG);
        #endif

        vec3 specTerm = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }

    #if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        vec3 computeAreaSpecularLighting(preLightingInfo info, vec3 specularColor) {
            vec3 fresnel = ( specularColor * info.areaLightFresnel.x + ( vec3( 1.0 ) - specularColor ) * info.areaLightFresnel.y );
	        return specularColor * fresnel * info.areaLightSpecular;
        }
    #endif

#endif

#ifdef ANISOTROPIC
    vec3 computeAnisotropicSpecularLighting(preLightingInfo info, vec3 V, vec3 N, vec3 T, vec3 B, float anisotropy, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
        float NdotH = saturateEps(dot(N, info.H));
        float TdotH = dot(T, info.H);
        float BdotH = dot(B, info.H);
        float TdotV = dot(T, V);
        float BdotV = dot(B, V);
        float TdotL = dot(T, info.L);
        float BdotL = dot(B, info.L);
        float alphaG = convertRoughnessToAverageSlope(info.roughness);
        vec2 alphaTB = getAnisotropicRoughness(alphaG, anisotropy);
        alphaTB = max(alphaTB, square(geometricRoughnessFactor));

        vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        float distribution = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
        float smithVisibility = smithVisibility_GGXCorrelated_Anisotropic(info.NdotL, info.NdotV, TdotV, BdotV, TdotL, BdotL, alphaTB);

        vec3 specTerm = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif

#ifdef CLEARCOAT
    vec4 computeClearCoatLighting(preLightingInfo info, vec3 Ncc, float geometricRoughnessFactor, float clearCoatIntensity, vec3 lightColor) {
        float NccdotL = saturateEps(dot(Ncc, info.L));
        float NccdotH = saturateEps(dot(Ncc, info.H));
        float clearCoatRoughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(clearCoatRoughness);

        float fresnel = fresnelSchlickGGX(info.VdotH, vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnel *= clearCoatIntensity;
        float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NccdotH, alphaG);
        float kelemenVisibility = visibility_Kelemen(info.VdotH);

        float clearCoatTerm = fresnel * distribution * kelemenVisibility;

        return vec4(
            clearCoatTerm * info.attenuation * NccdotL * lightColor,
            1.0 - fresnel
        );
    }

    vec3 computeClearCoatLightingAbsorption(float NdotVRefract, vec3 L, vec3 Ncc, vec3 clearCoatColor, float clearCoatThickness, float clearCoatIntensity) {
        vec3 LRefract = -refract(L, Ncc, vClearCoatRefractionParams.y);
        float NdotLRefract = saturateEps(dot(Ncc, LRefract));

        vec3 absorption = computeClearCoatAbsorption(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);
        return absorption;
    }
#endif

#ifdef SHEEN
    vec3 computeSheenLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
        float NdotH = saturateEps(dot(N, info.H));
        float roughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(roughness);

        // No Fresnel Effect with sheen
        // vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);
        float fresnel = 1.;
        float distribution = normalDistributionFunction_CharlieSheen(NdotH, alphaG);
        /*#ifdef SHEEN_SOFTER
            float visibility = visibility_CharlieSheen(info.NdotL, info.NdotV, alphaG);
        #else */
            float visibility = visibility_Ashikhmin(info.NdotL, info.NdotV);
        /* #endif */

        float sheenTerm = fresnel * distribution * visibility;
        return sheenTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif
