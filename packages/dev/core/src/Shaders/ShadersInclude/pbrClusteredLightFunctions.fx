#if defined(LIGHT{X}) && defined(CLUSTLIGHT{X}) && CLUSTLIGHT_MAX > 0
lightingInfo computeClusteredLighting{X}(
    vec3 V,
    vec3 N,
    vec3 posW,
    vec3 surfaceAlbedo,
    reflectivityOutParams reflectivityOut,
    vec3 diffuseScale
    #ifdef SS_TRANSLUCENCY
        , subSurfaceOutParams subSurfaceOut
    #endif
    #ifdef SPECULARTERM
        , vec3 specularScale
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
    vec4 maskTexel = texelFetch(tileMaskTexture{X}, ivec2(gl_FragCoord.xy * light{X}.vLightData.xy), 0);
    uint mask = uint(maskTexel.r);

    int len = int(light{X}.vLightData.w);
    for (int i = 0; i < len; i += 1) {
        if ((mask & (1u << i)) == 0u) {
            continue;
        }
        SpotLight light = light{X}.vLights[i];
        preLightingInfo preInfo = computePointAndSpotPreLightingInfo(light.position, V, N, posW);

        // Compute Attenuation infos
        preInfo.NdotV = NdotV;
        preInfo.attenuation = computeDistanceLightFalloff(preInfo.lightOffset, preInfo.lightDistanceSquared, light.falloff.x, light.falloff.y);
        preInfo.attenuation *= computeDirectionalLightFalloff(light.direction.xyz, preInfo.L, light.direction.w, light.position.w, light.falloff.z, light.falloff.w);

        float radius = light.specular.a;
        preInfo.roughness = adjustRoughnessFromLightProperties(reflectivityOut.roughness, radius, preInfo.lightDistance);
        preInfo.diffuseRoughness = reflectivityOut.diffuseRoughness;
        preInfo.surfaceAlbedo = surfaceAlbedo;
        lightingInfo info;

        // Diffuse contribution
        vec3 diffuse = light.diffuse.rgb * diffuseScale;
        #ifdef SS_TRANSLUCENCY
            #ifdef SS_TRANSLUCENCY_LEGACY
                info.diffuse = computeDiffuseTransmittedLighting(preInfo, diffuse, subSurfaceOut.transmittance);
                info.diffuseTransmission = vec3(0);
            #else
                info.diffuse = computeDiffuseLighting(preInfo, diffuse) * (1.0 - subSurfaceOut.translucencyIntensity);
                info.diffuseTransmission = computeDiffuseTransmittedLighting(preInfo, diffuse, subSurfaceOut.transmittance);
            #endif
        #else
            info.diffuse = computeDiffuseLighting(preInfo, diffuse);
        #endif

        // Specular contribution
        #ifdef SPECULARTERM
            vec3 specular = light.specular.rgb * specularScale;
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
                info.specular = computeAnisotropicSpecularLighting(preInfo, V, N, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactor, diffuse);
            #else
                info.specular = computeSpecularLighting(preInfo, N, specularEnvironmentR0, coloredFresnel, AARoughnessFactor, diffuse);
            #endif
        #endif

        // Sheen contribution
        #ifdef SHEEN
            #ifdef SHEEN_LINKWITHALBEDO
                preInfo.roughness = sheenOut.sheenIntensity;
            #endif
            preInfo.roughness = adjustRoughnessFromLightProperties(sheenOut.sheenRoughness, radius, preInfo.lightDistance);
            info.sheen = computeSheenLighting(preInfo, normalW, sheenOut.sheenColor, specularEnvironmentR90, AARoughnessFactor, diffuse);
        #endif

        // Clear Coat contribution
        #ifdef CLEARCOAT
            preInfo.roughness = adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness, radius, preInfo.lightDistance);
            info.clearCoat = computeClearCoatLighting(preInfo, clearcoatOut.clearCoatNormalW, clearcoatOut.clearCoatAARoughnessFactors.x, clearcoatOut.clearCoatIntensity, diffuse);

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
    return result;
}
#endif
