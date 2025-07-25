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
    vec3 diffuseTerm = vec3(1.0 / PI);
    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_LEGACY
        diffuseTerm = vec3(diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.roughness));
    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
        diffuseTerm = vec3(diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.diffuseRoughness));
    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
        vec3 clampedAlbedo = clamp(info.surfaceAlbedo, vec3(0.1), vec3(1.0));
        diffuseTerm = diffuseBRDF_EON(clampedAlbedo, info.diffuseRoughness, info.NdotL, info.NdotV, info.LdotV);
        diffuseTerm /= clampedAlbedo;
    #endif
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
        vec3 diffuseTerm = vec3(1.0 / PI);
        #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_LEGACY
            diffuseTerm = vec3(diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.roughness));
        #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
            diffuseTerm = vec3(diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.diffuseRoughness));
        #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
            vec3 clampedAlbedo = clamp(info.surfaceAlbedo, vec3(0.1), vec3(1.0));
            diffuseTerm = diffuseBRDF_EON(clampedAlbedo, info.diffuseRoughness, info.NdotL, info.NdotV, info.LdotV);
            diffuseTerm /= clampedAlbedo;
        #endif
    #else
        float diffuseTerm = diffuseBRDF_Burley(NdotL, info.NdotV, info.VdotH, info.roughness);
    #endif
        return diffuseTerm * transmittanceNdotL * info.attenuation * lightColor;
    }
#endif

#ifdef SPECULARTERM
    vec3 computeSpecularLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 fresnel, float geometricRoughnessFactor, vec3 lightColor) {
        float NdotH = saturateEps(dot(N, info.H));
        float roughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(roughness);

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
        vec3 computeAreaSpecularLighting(preLightingInfo info, vec3 specularColor, vec3 reflectance0, vec3 reflectance90) {
            vec3 fresnel = specularColor * info.areaLightFresnel.x * reflectance0 + ( vec3( 1.0 ) - specularColor ) * info.areaLightFresnel.y * reflectance90;
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

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
    lightingInfo computeClusteredLighting(
        sampler2D lightDataTexture,
        sampler2D tileMaskTexture,
        vec4 clusteredData,
        int numLights,
        vec3 V,
        vec3 N,
        vec3 posW,
        vec3 surfaceAlbedo,
        reflectivityOutParams reflectivityOut
        #ifdef SS_TRANSLUCENCY
            , subSurfaceOutParams subSurfaceOut
        #endif
        #ifdef SPECULARTERM
            , float AARoughnessFactor
        #endif
        #ifdef ANISOTROPIC
            , anisotropicOutParams anisotropicOut
        #endif
        #ifdef SHEEN
            , sheenOutParams sheenOut
        #endif
        #ifdef CLEARCOAT
            , clearcoatOutParams clearcoatOut
        #endif
    ) {
        float NdotV = absEps(dot(N, V));
#include<pbrBlockReflectance0>
        #ifdef CLEARCOAT
            specularEnvironmentR0 = clearcoatOut.specularEnvironmentR0;
        #endif

        lightingInfo result;
        int maskHeight = int(clusteredData.y);
        ivec2 tilePosition = ivec2(gl_FragCoord.xy * clusteredData.zw);
        tilePosition.y = min(tilePosition.y, maskHeight - 1);

        for (int i = 0; i < numLights;) {
            uint mask = uint(texelFetch(tileMaskTexture, tilePosition, 0).r);
            tilePosition.y += maskHeight;
            int batchEnd = min(i + CLUSTLIGHT_BATCH, numLights);
            for (; i < batchEnd && mask != 0u; i += 1, mask >>= 1) {
                if ((mask & 1u) == 0u) {
                    continue;
                }

                vec4 lightData = texelFetch(lightDataTexture, ivec2(0, i), 0);
                vec4 diffuse = texelFetch(lightDataTexture, ivec2(1, i), 0);
                vec4 specular = texelFetch(lightDataTexture, ivec2(2, i), 0);
                vec4 direction = texelFetch(lightDataTexture, ivec2(3, i), 0);
			    vec4 falloff = texelFetch(lightDataTexture, ivec2(4, i), 0);

                preLightingInfo preInfo = computePointAndSpotPreLightingInfo(lightData, V, N, posW);
                preInfo.NdotV = NdotV;

                // Compute Attenuation infos
                preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, falloff.x, falloff.y);
                preInfo.attenuation *= computeDirectionalLightFalloff(direction.xyz, preInfo.L, direction.w, lightData.w, falloff.z, falloff.w);

                preInfo.roughness = adjustRoughnessFromLightProperties(reflectivityOut.roughness, specular.a, preInfo.lightDistance);
                preInfo.diffuseRoughness = reflectivityOut.diffuseRoughness;
                preInfo.surfaceAlbedo = surfaceAlbedo;
                lightingInfo info;

                // Diffuse contribution
                #ifdef SS_TRANSLUCENCY
                    #ifdef SS_TRANSLUCENCY_LEGACY
                        info.diffuse = computeDiffuseTransmittedLighting(preInfo, diffuse.rgb, subSurfaceOut.transmittance);
                        info.diffuseTransmission = vec3(0);
                    #else
                        info.diffuse = computeDiffuseLighting(preInfo, diffuse.rgb) * (1.0 - subSurfaceOut.translucencyIntensity);
                        info.diffuseTransmission = computeDiffuseTransmittedLighting(preInfo, diffuse.rgb, subSurfaceOut.transmittance);
                    #endif
                #else
                    info.diffuse = computeDiffuseLighting(preInfo, diffuse.rgb);
                #endif

                // Specular contribution
                #ifdef SPECULARTERM
                    #if CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR
                        vec3 metalFresnel = reflectivityOut.specularWeight * getF82Specular(preInfo.VdotH, specularEnvironmentR0, reflectivityOut.colorReflectanceF90, reflectivityOut.roughness);
                        vec3 dielectricFresnel = fresnelSchlickGGX(preInfo.VdotH, reflectivityOut.dielectricColorF0, reflectivityOut.colorReflectanceF90);
                        vec3 coloredFresnel = mix(dielectricFresnel, metalFresnel, reflectivityOut.metallic);
                    #else
                        vec3 coloredFresnel = fresnelSchlickGGX(preInfo.VdotH, specularEnvironmentR0, reflectivityOut.colorReflectanceF90);
                    #endif
                    #ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
                        float NdotH = dot(N, preInfo.H);
                        vec3 fresnel = fresnelSchlickGGX(NdotH, vec3(reflectanceF0), specularEnvironmentR90);
                        info.diffuse *= (vec3(1.0) - fresnel);
                    #endif
                    #ifdef ANISOTROPIC
                        info.specular = computeAnisotropicSpecularLighting(preInfo, V, N, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactor, diffuse.rgb);
                    #else
                        info.specular = computeSpecularLighting(preInfo, N, specularEnvironmentR0, coloredFresnel, AARoughnessFactor, diffuse.rgb);
                    #endif
                #endif

                // Sheen contribution
                #ifdef SHEEN
                    #ifdef SHEEN_LINKWITHALBEDO
                        preInfo.roughness = sheenOut.sheenIntensity;
                    #else
                        preInfo.roughness = adjustRoughnessFromLightProperties(sheenOut.sheenRoughness, specular.a, preInfo.lightDistance);
                    #endif
                    info.sheen = computeSheenLighting(preInfo, normalW, sheenOut.sheenColor, specularEnvironmentR90, AARoughnessFactor, diffuse.rgb);
                #endif

                // Clear Coat contribution
                #ifdef CLEARCOAT
                    preInfo.roughness = adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness, specular.a, preInfo.lightDistance);
                    info.clearCoat = computeClearCoatLighting(preInfo, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatAARoughnessFactors.x, clearcoatOut.clearCoatIntensity, diffuse.rgb);

                    #ifdef CLEARCOAT_TINT
                        // Absorption
                        float absorption = computeClearCoatLightingAbsorption(clearcoatOut.clearCoatNdotVRefract, preInfo.L, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatColor, clearcoatOut.clearCoatThickness, clearcoatOut.clearCoatIntensity);
                        info.diffuse *= absorption;
                        #ifdef SS_TRANSLUCENCY
                            info.diffuseTransmission *= absorption;
                        #endif
                        #ifdef SPECULARTERM
                            info.specular *= absorption;
                        #endif
                    #endif

                    info.diffuse *= info.clearCoat.w;
                    #ifdef SS_TRANSLUCENCY
                        info.diffuseTransmission *= info.clearCoat.w;
                    #endif
                    #ifdef SPECULARTERM
                        info.specular *= info.clearCoat.w;
                    #endif
                    #ifdef SHEEN
                        info.sheen *= info.clearCoat.w;
                    #endif
                #endif

                // Apply contributions to result
                result.diffuse += info.diffuse;
                #ifdef SS_TRANSLUCENCY
                    result.diffuseTransmission += info.diffuseTransmission;
                #endif
                #ifdef SPECULARTERM
                    result.specular += info.specular;
                #endif
                #ifdef CLEARCOAT
                    result.clearCoat += info.clearCoat;
                #endif
                #ifdef SHEEN
                    result.sheen += info.sheen;
                #endif
            }
            i = batchEnd;
        }
        return result;
    }
#endif
