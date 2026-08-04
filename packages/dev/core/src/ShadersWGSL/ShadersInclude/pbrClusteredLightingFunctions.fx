// Per-light specialization so the tile mask storage buffer is accessed from module
// scope. Passing ptr<storage, ...> as a function parameter requires the optional
// WGSL extension unrestricted_pointer_parameters, which Firefox/Naga does not implement.
#if defined(CLUSTLIGHT{X}) && defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
fn computeClusteredLighting{X}(
    lightDataTexture: texture_2d<f32>,
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
        var mask = tileMaskBuffer{X}[tileIndex];
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
                    info.specular = computeAnisotropicSpecularLighting(preInfo, V, N, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactor, light.vLightDiffuse.rgb);
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
