// ______________________________________________________________________________
// _____________________________ Energy Conservation  ___________________________
// Apply Energy Conservation.
// _____________________________ IBL BRDF + Energy Cons ________________________________
#if defined(ENVIRONMENTBRDF)
    #ifdef MS_BRDF_ENERGY_CONSERVATION
        vec3 energyConservationFactor = getEnergyConservationFactor(clearcoatOut.specularEnvironmentR0, environmentBrdf);
    #endif
#endif

#ifndef METALLICWORKFLOW
    #ifdef SPECULAR_GLOSSINESS_ENERGY_CONSERVATION
        surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;
    #endif
#endif

#if defined(SHEEN) && defined(SHEEN_ALBEDOSCALING) && defined(ENVIRONMENTBRDF)
    surfaceAlbedo.rgb = sheenOut.sheenAlbedoScaling * surfaceAlbedo.rgb;
#endif

// _____________________________ Irradiance ______________________________________
#ifdef REFLECTION
    vec3 finalIrradiance = reflectionOut.environmentIrradiance;

    #if defined(CLEARCOAT)
        finalIrradiance *= clearcoatOut.conservationFactor;
        #if defined(CLEARCOAT_TINT)
            finalIrradiance *= clearcoatOut.absorption;
        #endif
    #endif

    #if defined(SS_REFRACTION)
        finalIrradiance *= subSurfaceOut.refractionFactorForIrradiance;
    #endif

    #if defined(SS_TRANSLUCENCY)
        finalIrradiance += subSurfaceOut.refractionIrradiance;
    #endif

    finalIrradiance *= surfaceAlbedo.rgb;
    finalIrradiance *= vLightingIntensity.z;
    finalIrradiance *= aoOut.ambientOcclusionColor;
#endif

// _____________________________ Specular ________________________________________
#ifdef SPECULARTERM
    vec3 finalSpecular = specularBase;
    finalSpecular = max(finalSpecular, 0.0);

    vec3 finalSpecularScaled = finalSpecular * vLightingIntensity.x * vLightingIntensity.w;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalSpecularScaled *= energyConservationFactor;
    #endif

    #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        finalSpecularScaled *= sheenOut.sheenAlbedoScaling;
    #endif
#endif

// _____________________________ Radiance ________________________________________
#ifdef REFLECTION
    vec3 finalRadiance = reflectionOut.environmentRadiance.rgb;
    finalRadiance *= subSurfaceOut.specularEnvironmentReflectance;

    vec3 finalRadianceScaled = finalRadiance * vLightingIntensity.z;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalRadianceScaled *= energyConservationFactor;
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

    #if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)
        alpha = saturate(alpha + luminanceOverAlpha * luminanceOverAlpha);
    #endif
#endif
