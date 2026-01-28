#define CLEARCOATREFLECTANCE90 1.0

// Light Results
struct lightingInfo
{
    diffuse: vec3f,
    #ifdef SS_TRANSLUCENCY
        diffuseTransmission: vec3f,
    #endif
    #ifdef SPECULARTERM
        specular: vec3f,
    #endif
    #ifdef CLEARCOAT
        // xyz contains the clearcoat color.
        // w contains the 1 - clearcoat fresnel to ease the energy conservation computation.
        clearCoat: vec4f,
    #endif
    #ifdef SHEEN
        sheen: vec3f
    #endif
};

// Simulate area (small) lights by increasing roughness
fn adjustRoughnessFromLightProperties(roughness: f32, lightRadius: f32, lightDistance: f32) -> f32 {
    #if defined(USEPHYSICALLIGHTFALLOFF) || defined(USEGLTFLIGHTFALLOFF)
        // At small angle this approximation works.
        var lightRoughness: f32 = lightRadius / lightDistance;
        // Distribution can sum.
        var totalRoughness: f32 = saturate(lightRoughness + roughness);
        return totalRoughness;
    #else
        return roughness;
    #endif
}

fn computeHemisphericDiffuseLighting(info: preLightingInfo, lightColor: vec3f, groundColor: vec3f) -> vec3f {
    return mix(groundColor, lightColor, info.NdotL);
}

#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
    fn computeAreaDiffuseLighting(info: preLightingInfo, lightColor: vec3f) -> vec3f {
        return info.areaLightDiffuse * lightColor;
    }
#endif

fn computeDiffuseLighting(info: preLightingInfo, lightColor: vec3f) -> vec3f {
    var diffuseTerm: vec3f = vec3f(1.0 / PI);
    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_LEGACY
        diffuseTerm = vec3f(diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.roughness));
    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
        diffuseTerm = vec3f(diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.diffuseRoughness));
    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
        var clampedAlbedo: vec3f = clamp(info.surfaceAlbedo, vec3f(0.1), vec3f(1.0));
        diffuseTerm = diffuseBRDF_EON(clampedAlbedo, info.diffuseRoughness, info.NdotL, info.NdotV, info.LdotV);
        diffuseTerm /= clampedAlbedo;
    #endif
    return diffuseTerm * info.attenuation * info.NdotL * lightColor;
}

fn computeProjectionTextureDiffuseLighting(projectionLightTexture: texture_2d<f32>, projectionLightSampler: sampler, textureProjectionMatrix: mat4x4f, posW: vec3f) -> vec3f{
    var strq: vec4f = textureProjectionMatrix *  vec4f(posW, 1.0);
    strq /= strq.w;
    var textureColor: vec3f = textureSample(projectionLightTexture, projectionLightSampler, strq.xy).rgb;
    return toLinearSpaceVec3(textureColor);
}

#ifdef SS_TRANSLUCENCY
    fn computeDiffuseTransmittedLighting(info: preLightingInfo, lightColor: vec3f, transmittance: vec3f) -> vec3f {
        var transmittanceNdotL = vec3f(0.0);
        var NdotL: f32 = absEps(info.NdotLUnclamped);
    #ifndef SS_TRANSLUCENCY_LEGACY
        if (info.NdotLUnclamped < 0.0) {
    #endif
            // Use wrap lighting to simulate SSS.
            var wrapNdotL: f32 = computeWrappedDiffuseNdotL(NdotL, 0.02);

            // Remap transmittance from tr to 1. if ndotl is negative.
            var trAdapt: f32 = step(0., info.NdotLUnclamped);
            transmittanceNdotL = mix(transmittance * wrapNdotL,  vec3f(wrapNdotL), trAdapt);
    #ifndef SS_TRANSLUCENCY_LEGACY
        }
        var diffuseTerm : vec3f = vec3f(1.0 / PI);
        #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_LEGACY
        diffuseTerm = vec3f(diffuseBRDF_Burley(
                    info.NdotL, info.NdotV, info.VdotH, info.roughness));
        #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
        diffuseTerm = vec3f(diffuseBRDF_Burley(
                    info.NdotL, info.NdotV, info.VdotH, info.diffuseRoughness));
        #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
        var clampedAlbedo: vec3f = clamp(info.surfaceAlbedo, vec3f(0.1), vec3f(1.0));
        diffuseTerm = diffuseBRDF_EON(clampedAlbedo, info.diffuseRoughness,
                    info.NdotL, info.NdotV, info.LdotV);
                    diffuseTerm /= clampedAlbedo;
        #endif
        return (transmittanceNdotL * diffuseTerm) * info.attenuation * lightColor;
    #else
        let diffuseTerm = diffuseBRDF_Burley(NdotL, info.NdotV, info.VdotH, info.roughness);
        return diffuseTerm * transmittanceNdotL * info.attenuation * lightColor;
    #endif
    }
#endif

#ifdef SPECULARTERM
    fn computeSpecularLighting(info: preLightingInfo, N: vec3f, reflectance0: vec3f, fresnel: vec3f, geometricRoughnessFactor: f32, lightColor: vec3f) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var roughness: f32 = max(info.roughness, geometricRoughnessFactor);
        var alphaG: f32 = convertRoughnessToAverageSlope(roughness);
        var modifiedFresnel: vec3f = fresnel;
        #ifdef IRIDESCENCE
            modifiedFresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        var distribution: f32 = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);

        #ifdef BRDF_V_HEIGHT_CORRELATED
            var smithVisibility: f32 = smithVisibility_GGXCorrelated(info.NdotL, info.NdotV, alphaG);
        #else
            var smithVisibility: f32 = smithVisibility_TrowbridgeReitzGGXFast(info.NdotL, info.NdotV, alphaG);
        #endif

        var specTerm: vec3f = modifiedFresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }

    #if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        fn computeAreaSpecularLighting(info: preLightingInfo, specularColor: vec3f, reflectance0: vec3f, reflectance90: vec3f) -> vec3f {
            var fresnel:vec3f  = reflectance0 * specularColor * info.areaLightFresnel.x + ( vec3f( 1.0 ) - specularColor ) * info.areaLightFresnel.y * reflectance90;
            return specularColor * fresnel * info.areaLightSpecular;
        }
    #endif
#endif

#ifdef FUZZ
fn evalFuzz(L: vec3f, NdotL: f32, NdotV: f32, T: vec3f, B: vec3f, ltcLut: vec3f) -> f32
{
    // Cosine terms
    if (NdotL <= 0.0f || NdotV <= 0.0f) {
        return 0.0f;
    }

    // === 3. Build LTC transform ===
    // This matrix warps the hemisphere to match the BRDF shape
    let M = mat3x3f(
        vec3f(ltcLut.r, 0.0f, 0.0f),
        vec3f(ltcLut.g, 1.0f, 0.0f),
        vec3f(0.0f, 0.0f, 1.0f)
    );

    // === 4. Transform light direction to local tangent space ===
    let Llocal: vec3f = vec3f(dot(L, T), dot(L, B), NdotL);

    // Apply the LTC transform
    let Lwarp: vec3f = normalize(M * Llocal);

    // === 5. Compute projected cosine term ===
    let cosThetaWarp: f32 = max(Lwarp.z, 0.0f);
    return cosThetaWarp * NdotL;
}
#endif

#if defined(ANISOTROPIC) && defined(ANISOTROPIC_OPENPBR)
    fn computeAnisotropicSpecularLighting(info: preLightingInfo, V: vec3f, N: vec3f, T: vec3f, B: vec3f, anisotropy: f32, geometricRoughnessFactor: f32, lightColor: vec3f) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var TdotH: f32 = dot(T, info.H);
        var BdotH: f32 = dot(B, info.H);
        var TdotV: f32 = dot(T, V);
        var BdotV: f32 = dot(B, V);
        var TdotL: f32 = dot(T, info.L);
        var BdotL: f32 = dot(B, info.L);
        var alphaG: f32 = convertRoughnessToAverageSlope(info.roughness);
        var alphaTB: vec2f = getAnisotropicRoughness(alphaG, anisotropy);

        var distribution: f32 = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
        var smithVisibility: f32 = smithVisibility_GGXCorrelated_Anisotropic(info.NdotL, info.NdotV, TdotV, BdotV, TdotL, BdotL, alphaTB);

        var specTerm: vec3f = vec3f(distribution * smithVisibility);
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }
#elif defined(ANISOTROPIC)
    fn computeAnisotropicSpecularLighting(info: preLightingInfo, V: vec3f, N: vec3f, T: vec3f, B: vec3f, anisotropy: f32, reflectance0: vec3f, reflectance90: vec3f, geometricRoughnessFactor: f32, lightColor: vec3f) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var TdotH: f32 = dot(T, info.H);
        var BdotH: f32 = dot(B, info.H);
        var TdotV: f32 = dot(T, V);
        var BdotV: f32 = dot(B, V);
        var TdotL: f32 = dot(T, info.L);
        var BdotL: f32 = dot(B, info.L);
        var alphaG: f32 = convertRoughnessToAverageSlope(info.roughness);
        var alphaTB: vec2f = getAnisotropicRoughness(alphaG, anisotropy);
        alphaTB = max(alphaTB, vec2f(geometricRoughnessFactor * geometricRoughnessFactor));

        var fresnel: vec3f = fresnelSchlickGGXVec3(info.VdotH, reflectance0, reflectance90);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        var distribution: f32 = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
        var smithVisibility: f32 = smithVisibility_GGXCorrelated_Anisotropic(info.NdotL, info.NdotV, TdotV, BdotV, TdotL, BdotL, alphaTB);

        var specTerm: vec3f = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif

#ifdef CLEARCOAT
    fn computeClearCoatLighting(info: preLightingInfo, Ncc: vec3f, geometricRoughnessFactor: f32, clearCoatIntensity: f32, lightColor: vec3f) -> vec4f {
        var NccdotL: f32 = saturateEps(dot(Ncc, info.L));
        var NccdotH: f32 = saturateEps(dot(Ncc, info.H));
        var clearCoatRoughness: f32 = max(info.roughness, geometricRoughnessFactor);
        var alphaG: f32 = convertRoughnessToAverageSlope(clearCoatRoughness);

        var fresnel: f32 = fresnelSchlickGGX(info.VdotH, uniforms.vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnel *= clearCoatIntensity;
        var distribution: f32 = normalDistributionFunction_TrowbridgeReitzGGX(NccdotH, alphaG);
        var kelemenVisibility: f32 = visibility_Kelemen(info.VdotH);

        var clearCoatTerm: f32 = fresnel * distribution * kelemenVisibility;

        return  vec4f(
            clearCoatTerm * info.attenuation * NccdotL * lightColor,
            1.0 - fresnel
        );
    }

    fn computeClearCoatLightingAbsorption(NdotVRefract: f32, L: vec3f, Ncc: vec3f, clearCoatColor: vec3f, clearCoatThickness: f32, clearCoatIntensity: f32) -> vec3f {
        var LRefract: vec3f = -refract(L, Ncc, uniforms.vClearCoatRefractionParams.y);
        var NdotLRefract: f32 = saturateEps(dot(Ncc, LRefract));

        var absorption: vec3f = computeClearCoatAbsorption(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);
        return absorption;
    }
#endif

#ifdef SHEEN
    fn computeSheenLighting(info: preLightingInfo, N: vec3f, reflectance0: vec3f, reflectance90: vec3f, geometricRoughnessFactor: f32, lightColor: vec3f) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var roughness: f32 = max(info.roughness, geometricRoughnessFactor);
        var alphaG: f32 = convertRoughnessToAverageSlope(roughness);

        // No Fresnel Effect with sheen
        // var fresnel: vec3f = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);
        var fresnel: f32 = 1.;
        var distribution: f32 = normalDistributionFunction_CharlieSheen(NdotH, alphaG);
        /*#ifdef SHEEN_SOFTER
            var visibility: f32 = visibility_CharlieSheen(info.NdotL, info.NdotV, alphaG);
        #else */
            var visibility: f32 = visibility_Ashikhmin(info.NdotL, info.NdotV);
        /* #endif */

        var sheenTerm: f32 = fresnel * distribution * visibility;
        return sheenTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
#include<clusteredLightingFunctions>

    fn computeClusteredLighting(
        lightDataTexture: texture_2d<f32>,
        tileMaskBuffer: ptr<storage, array<u32>>,
        lightData: vec4f,
        sliceRange: vec2u,
        V: vec3f,
        N: vec3f,
        posW: vec3f,
        surfaceAlbedo: vec3f,
        reflectivityOut: reflectivityOutParams,
        #ifdef IRIDESCENCE
            iridescenceIntensity: f32,
        #endif
        #ifdef SS_TRANSLUCENCY
            subSurfaceOut: subSurfaceOutParams,
        #endif
        #ifdef SPECULARTERM
            AARoughnessFactor: f32,
        #endif
        #ifdef ANISOTROPIC
            anisotropicOut: anisotropicOutParams,
        #endif
        #ifdef SHEEN
            sheenOut: sheenOutParams,
        #endif
        #ifdef CLEARCOAT
            clearcoatOut: clearcoatOutParams,
        #endif
    ) -> lightingInfo {
        let NdotV = absEps(dot(N, V));
#include<pbrBlockReflectance0>
        #ifdef CLEARCOAT
            specularEnvironmentR0 = clearcoatOut.specularEnvironmentR0;
        #endif

        var result: lightingInfo;
        let tilePosition = vec2u(fragmentInputs.position.xy * lightData.xy);
        let maskResolution = vec2u(lightData.zw);
        var tileIndex = (tilePosition.x * maskResolution.x + tilePosition.y) * maskResolution.y;

        let batchRange = sliceRange / CLUSTLIGHT_BATCH;
        var batchOffset = batchRange.x * CLUSTLIGHT_BATCH;
        tileIndex += batchRange.x;

        for (var i = batchRange.x; i <= batchRange.y; i += 1) {
            var mask = tileMaskBuffer[tileIndex];
            tileIndex += 1;
            // Mask out the bits outside the range
            let maskOffset = max(sliceRange.x, batchOffset) - batchOffset; // Be careful with unsigned values
            let maskWidth = min(sliceRange.y - batchOffset + 1, CLUSTLIGHT_BATCH);
            mask = extractBits(mask, maskOffset, maskWidth);

            while mask != 0 {
                let trailing = firstTrailingBit(mask);
                mask ^= 1u << trailing;
                let light = getClusteredLight(lightDataTexture, batchOffset + maskOffset + trailing);

                var preInfo = computePointAndSpotPreLightingInfo(light.vLightData, V, N, posW);
                preInfo.NdotV = NdotV;

                // Compute Attenuation infos
                preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, light.vLightFalloff.x, light.vLightFalloff.y);
                // Assume an angle greater than 180º is a point light
                if light.vLightDirection.w >= 0.0 {
                    preInfo.attenuation *= computeDirectionalLightFalloff(light.vLightDirection.xyz, preInfo.L, light.vLightDirection.w, light.vLightData.w, light.vLightFalloff.z, light.vLightFalloff.w);
                }

                preInfo.roughness = adjustRoughnessFromLightProperties(reflectivityOut.roughness, light.vLightSpecular.a, preInfo.lightDistance);
                preInfo.diffuseRoughness = reflectivityOut.diffuseRoughness;
                preInfo.surfaceAlbedo = surfaceAlbedo;

                #ifdef IRIDESCENCE
                    preInfo.iridescenceIntensity = iridescenceIntensity;
                #endif
                var info: lightingInfo;

                // Diffuse contribution
                #ifdef SS_TRANSLUCENCY
                    #ifdef SS_TRANSLUCENCY_LEGACY
                        info.diffuse = computeDiffuseTransmittedLighting(preInfo, light.vLightDiffuse.rgb, subSurfaceOut.transmittance);
                        info.diffuseTransmission = vec3(0);
                    #else
                        info.diffuse = computeDiffuseLighting(preInfo, light.vLightDiffuse.rgb) * (1.0 - subSurfaceOut.translucencyIntensity);
                        info.diffuseTransmission = computeDiffuseTransmittedLighting(preInfo, light.vLightDiffuse.rgb, subSurfaceOut.transmittance);
                    #endif
                #else
                    info.diffuse = computeDiffuseLighting(preInfo, light.vLightDiffuse.rgb);
                #endif

                // Specular contribution
                #ifdef SPECULARTERM
                    #if CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR
                        let metalFresnel = reflectivityOut.specularWeight * getF82Specular(preInfo.VdotH, specularEnvironmentR0, reflectivityOut.colorReflectanceF90, reflectivityOut.roughness);
                        let dielectricFresnel = fresnelSchlickGGXVec3(preInfo.VdotH, reflectivityOut.dielectricColorF0, reflectivityOut.colorReflectanceF90);
                        let coloredFresnel = mix(dielectricFresnel, metalFresnel, reflectivityOut.metallic);
                    #else
                        let coloredFresnel = fresnelSchlickGGXVec3(preInfo.VdotH, specularEnvironmentR0, reflectivityOut.colorReflectanceF90);
                    #endif
                    #ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
                        let NdotH = dot(N, preInfo.H);
                        let fresnel = fresnelSchlickGGXVec3(NdotH, vec3(reflectanceF0), specularEnvironmentR90);
                        info.diffuse *= (vec3(1.0) - fresnel);
                    #endif
                    #ifdef ANISOTROPIC
                        info.specular = computeAnisotropicSpecularLighting(preInfo, V, N, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactor, light.vLightDiffuse.rgb);
                    #else
                        info.specular = computeSpecularLighting(preInfo, N, specularEnvironmentR0, coloredFresnel, AARoughnessFactor, light.vLightDiffuse.rgb);
                    #endif
                #endif

                // Sheen contribution
                #ifdef SHEEN
                    #ifdef SHEEN_LINKWITHALBEDO
                        preInfo.roughness = sheenOut.sheenIntensity;
                    #else
                        preInfo.roughness = adjustRoughnessFromLightProperties(sheenOut.sheenRoughness, light.vLightSpecular.a, preInfo.lightDistance);
                    #endif
                    info.sheen = computeSheenLighting(preInfo, normalW, sheenOut.sheenColor, specularEnvironmentR90, AARoughnessFactor, light.vLightDiffuse.rgb);
                #endif

                // Clear Coat contribution
                #ifdef CLEARCOAT
                    preInfo.roughness = adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness, light.vLightSpecular.a, preInfo.lightDistance);
                    info.clearCoat = computeClearCoatLighting(preInfo, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatAARoughnessFactors.x, clearcoatOut.clearCoatIntensity, light.vLightDiffuse.rgb);

                    #ifdef CLEARCOAT_TINT
                        // Absorption
                        let absorption = computeClearCoatLightingAbsorption(clearcoatOut.clearCoatNdotVRefract, preInfo.L, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatColor, clearcoatOut.clearCoatThickness, clearcoatOut.clearCoatIntensity);
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
            batchOffset += CLUSTLIGHT_BATCH;
        }
        return result;
    }
#endif
