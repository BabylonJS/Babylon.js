aggShadow = aggShadow / numLights;

// ______________________________________________________________________________
// _____________________________ Energy Conservation  ___________________________
// Apply Energy Conservation.
// _____________________________ IBL BRDF + Energy Cons ________________________________
#if defined(ENVIRONMENTBRDF)
    #ifdef MS_BRDF_ENERGY_CONSERVATION
        vec3 baseSpecularEnergyConservationFactor = getEnergyConservationFactor(vec3(reflectanceF0), environmentBrdf);
        vec3 coloredEnergyConservationFactor = getEnergyConservationFactor(specularEnvironmentR0, environmentBrdf);
    #endif
#endif

// _____________________________ Irradiance ______________________________________
#ifdef REFLECTION
    vec3 finalIrradiance = reflectionOut.environmentIrradiance;
    
    // Account for energy loss due to specular reflectance
    vec3 baseSpecularEnergy = vec3(baseSpecularEnvironmentReflectance);
    #if defined(ENVIRONMENTBRDF)
        #ifdef MS_BRDF_ENERGY_CONSERVATION
            baseSpecularEnergy *= baseSpecularEnergyConservationFactor;
        #endif
    #endif
    finalIrradiance *= clamp(vec3(1.0) - baseSpecularEnergy, 0.0, 1.0);
    finalIrradiance *= vLightingIntensity.z;
    finalIrradiance *= surfaceAlbedo.rgb;
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
#endif

// _____________________________ Radiance ________________________________________
#ifdef REFLECTION
    vec3 finalRadiance = reflectionOut.environmentRadiance.rgb;
    finalRadiance *= colorSpecularEnvironmentReflectance;
    
    vec3 finalRadianceScaled = finalRadiance * vLightingIntensity.z;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalRadianceScaled *= coloredEnergyConservationFactor;
    #endif
#endif

// _____________________________ Highlights on Alpha _____________________________
#ifdef ALPHABLEND
    float luminanceOverAlpha = 0.0;
    #if	defined(REFLECTION) && defined(RADIANCEOVERALPHA)
        luminanceOverAlpha += getLuminance(finalRadianceScaled);
    #endif

    #if defined(SPECULARTERM) && defined(SPECULAROVERALPHA)
        luminanceOverAlpha += getLuminance(finalSpecularScaled);
    #endif

    #if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)
        alpha = saturate(alpha + luminanceOverAlpha * luminanceOverAlpha);
    #endif
#endif
