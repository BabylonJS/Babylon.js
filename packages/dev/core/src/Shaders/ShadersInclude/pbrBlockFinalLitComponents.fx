aggShadow = aggShadow / numLights;

// ______________________________________________________________________________
// _____________________________ Energy Conservation  ___________________________
// Apply Energy Conservation.
// _____________________________ IBL BRDF + Energy Cons ________________________________
#if defined(ENVIRONMENTBRDF)
    #ifdef MS_BRDF_ENERGY_CONSERVATION
        vec3 baseSpecularEnergyConservationFactor = getEnergyConservationFactor(vec3(reflectanceF0), environmentBrdf);
        vec3 coloredEnergyConservationFactor = getEnergyConservationFactor(clearcoatOut.specularEnvironmentR0, environmentBrdf);
    #endif
#endif

#if defined(SHEEN) && defined(SHEEN_ALBEDOSCALING) && defined(ENVIRONMENTBRDF)
    surfaceAlbedo.rgb = sheenOut.sheenAlbedoScaling * surfaceAlbedo.rgb;
#endif

#ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
    // Remove F0 energy from albedo.
    // For metallic workflow, this is already done in the reflectivity block.
    #ifndef METALLICWORKFLOW
        #ifdef SPECULAR_GLOSSINESS_ENERGY_CONSERVATION
            surfaceAlbedo.rgb = (1. - reflectanceF0) * surfaceAlbedo.rgb;
        #endif
    #endif
#endif

// _____________________________ Irradiance ______________________________________
#ifdef REFLECTION
    vec3 finalIrradiance = reflectionOut.environmentIrradiance;

    #ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
        #if defined(METALLICWORKFLOW) || defined(SPECULAR_GLOSSINESS_ENERGY_CONSERVATION)
            // Account for energy loss due to specular reflectance
            vec3 baseSpecularEnergy = vec3(baseSpecularEnvironmentReflectance);
            #if defined(ENVIRONMENTBRDF)
                #ifdef MS_BRDF_ENERGY_CONSERVATION
                    baseSpecularEnergy *= baseSpecularEnergyConservationFactor;
                #endif
            #endif
            finalIrradiance *= clamp(vec3(1.0) - baseSpecularEnergy, 0.0, 1.0);
        #endif
    #endif

    #if defined(CLEARCOAT)
        finalIrradiance *= clearcoatOut.conservationFactor;
        #if defined(CLEARCOAT_TINT)
            finalIrradiance *= clearcoatOut.absorption;
        #endif
    #endif

    #ifndef SS_APPLY_ALBEDO_AFTER_SUBSURFACE
        finalIrradiance *= surfaceAlbedo.rgb;
    #endif

    #if defined(SS_REFRACTION)
        finalIrradiance *= subSurfaceOut.refractionOpacity;
    #endif

    #if defined(SS_TRANSLUCENCY)
        finalIrradiance *= (1.0 - subSurfaceOut.translucencyIntensity);
        finalIrradiance += subSurfaceOut.refractionIrradiance;
    #endif

    #ifdef SS_APPLY_ALBEDO_AFTER_SUBSURFACE
        finalIrradiance *= surfaceAlbedo.rgb;
    #endif

    finalIrradiance *= vLightingIntensity.z;
    finalIrradiance *= aoOut.ambientOcclusionColor;
#endif

// _____________________________ Specular ________________________________________
#ifdef SPECULARTERM
    vec3 finalSpecular = specularBase;
    finalSpecular = max(finalSpecular, 0.0);

    vec3 finalSpecularScaled = finalSpecular * vLightingIntensity.x * vLightingIntensity.w;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalSpecularScaled *= coloredEnergyConservationFactor;
    #endif

    #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        finalSpecularScaled *= sheenOut.sheenAlbedoScaling;
    #endif
#endif

// _____________________________ Radiance ________________________________________
#ifdef REFLECTION
    vec3 finalRadiance = reflectionOut.environmentRadiance.rgb;
    finalRadiance *= colorSpecularEnvironmentReflectance;
    
    vec3 finalRadianceScaled = finalRadiance * vLightingIntensity.z;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalRadianceScaled *= coloredEnergyConservationFactor;
    #endif

    #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        finalRadianceScaled *= sheenOut.sheenAlbedoScaling;
    #endif
#endif

// ________________________________ Sheen ________________________________________
#ifdef SHEEN
    vec3 finalSheen = sheenBase * sheenOut.sheenColor;
    finalSheen = max(finalSheen, 0.0);

    vec3 finalSheenScaled = finalSheen * vLightingIntensity.x * vLightingIntensity.w;
    
    #if defined(CLEARCOAT) && defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        sheenOut.finalSheenRadianceScaled *= clearcoatOut.conservationFactor;

        #if defined(CLEARCOAT_TINT)
            sheenOut.finalSheenRadianceScaled *= clearcoatOut.absorption;
        #endif
    #endif
#endif

// _____________________________ Clear Coat _______________________________________
#ifdef CLEARCOAT
    vec3 finalClearCoat = clearCoatBase;
    finalClearCoat = max(finalClearCoat, 0.0);

    vec3 finalClearCoatScaled = finalClearCoat * vLightingIntensity.x * vLightingIntensity.w;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalClearCoatScaled *= clearcoatOut.energyConservationFactorClearCoat;
    #endif

    #ifdef SS_REFRACTION
        subSurfaceOut.finalRefraction *= clearcoatOut.conservationFactor;

        #ifdef CLEARCOAT_TINT
            subSurfaceOut.finalRefraction *= clearcoatOut.absorption;
        #endif
    #endif
#endif

// _____________________________ Highlights on Alpha _____________________________
#ifdef ALPHABLEND
    float luminanceOverAlpha = 0.0;
    #if	defined(REFLECTION) && defined(RADIANCEOVERALPHA)
        luminanceOverAlpha += getLuminance(finalRadianceScaled);
        #if defined(CLEARCOAT)
            luminanceOverAlpha += getLuminance(clearcoatOut.finalClearCoatRadianceScaled);
        #endif
    #endif

    #if defined(SPECULARTERM) && defined(SPECULAROVERALPHA)
        luminanceOverAlpha += getLuminance(finalSpecularScaled);
    #endif

    #if defined(CLEARCOAT) && defined(CLEARCOATOVERALPHA)
        luminanceOverAlpha += getLuminance(finalClearCoatScaled);
    #endif

    #if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA) || defined(CLEARCOATOVERALPHA)
        alpha = saturate(alpha + luminanceOverAlpha * luminanceOverAlpha);
    #endif
#endif
