aggShadow = aggShadow / numLights;

// ______________________________________________________________________________
// _____________________________ Energy Conservation  ___________________________
// Apply Energy Conservation.
// _____________________________ IBL BRDF + Energy Cons ________________________________
#if defined(ENVIRONMENTBRDF)
    #ifdef MS_BRDF_ENERGY_CONSERVATION
        var energyConservationFactor: vec3f = getEnergyConservationFactor(clearcoatOut.specularEnvironmentR0, environmentBrdf);
    #endif
#endif

#ifndef METALLICWORKFLOW
    #ifdef SPECULAR_GLOSSINESS_ENERGY_CONSERVATION
        surfaceAlbedo = (1. - reflectance) * surfaceAlbedo.rgb;
    #endif
#endif

#if defined(SHEEN) && defined(SHEEN_ALBEDOSCALING) && defined(ENVIRONMENTBRDF)
    surfaceAlbedo = sheenOut.sheenAlbedoScaling * surfaceAlbedo.rgb;
#endif

// _____________________________ Irradiance ______________________________________
#ifdef REFLECTION
    var finalIrradiance: vec3f = reflectionOut.environmentIrradiance;

    #if defined(CLEARCOAT)
        finalIrradiance *= clearcoatOut.conservationFactor;
        #if defined(CLEARCOAT_TINT)
            finalIrradiance *= clearcoatOut.absorption;
        #endif
    #endif

    finalIrradiance *= surfaceAlbedo.rgb;

    #if defined(SS_REFRACTION)
        finalIrradiance *= subSurfaceOut.refractionFactorForIrradiance;
    #endif

    #if defined(SS_TRANSLUCENCY)
        finalIrradiance *= (1.0 - subSurfaceOut.translucencyIntensity);
        finalIrradiance += subSurfaceOut.refractionIrradiance;
    #endif

    finalIrradiance *= uniforms.vLightingIntensity.z;
    finalIrradiance *= aoOut.ambientOcclusionColor;
#endif

// _____________________________ Specular ________________________________________
#ifdef SPECULARTERM
    var finalSpecular: vec3f = specularBase;
    finalSpecular = max(finalSpecular, vec3f(0.0));

    var finalSpecularScaled: vec3f = finalSpecular * uniforms.vLightingIntensity.x * uniforms.vLightingIntensity.w;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalSpecularScaled *= energyConservationFactor;
    #endif

    #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        finalSpecularScaled *= sheenOut.sheenAlbedoScaling;
    #endif
#endif

// _____________________________ Radiance ________________________________________
#ifdef REFLECTION
    var finalRadiance: vec3f = reflectionOut.environmentRadiance.rgb;
    finalRadiance *= subSurfaceOut.specularEnvironmentReflectance;

    var finalRadianceScaled: vec3f = finalRadiance * uniforms.vLightingIntensity.z;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalRadianceScaled *= energyConservationFactor;
    #endif

    #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
        finalRadianceScaled *= sheenOut.sheenAlbedoScaling;
    #endif
#endif

// ________________________________ Sheen ________________________________________
#ifdef SHEEN
    var finalSheen: vec3f = sheenBase * sheenOut.sheenColor;
    finalSheen = max(finalSheen, vec3f(0.0));

    var finalSheenScaled: vec3f = finalSheen * uniforms.vLightingIntensity.x * uniforms.vLightingIntensity.w;
    
    #if defined(CLEARCOAT) && defined(REFLECTION) && defined(ENVIRONMENTBRDF)
        sheenOut.finalSheenRadianceScaled *= clearcoatOut.conservationFactor;

        #if defined(CLEARCOAT_TINT)
            sheenOut.finalSheenRadianceScaled *= clearcoatOut.absorption;
        #endif
    #endif
#endif

// _____________________________ Clear Coat _______________________________________
#ifdef CLEARCOAT
    var finalClearCoat: vec3f = clearCoatBase;
    finalClearCoat = max(finalClearCoat, vec3f(0.0));

    var finalClearCoatScaled: vec3f = finalClearCoat * uniforms.vLightingIntensity.x * uniforms.vLightingIntensity.w;

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
    var luminanceOverAlpha: f32 = 0.0;
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
