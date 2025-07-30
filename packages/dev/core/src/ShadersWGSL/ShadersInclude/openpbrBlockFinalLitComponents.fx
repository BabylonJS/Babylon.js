aggShadow = aggShadow / numLights;

// ______________________________________________________________________________
// _____________________________ Energy Conservation  ___________________________
// Apply Energy Conservation.
// _____________________________ IBL BRDF + Energy Cons ________________________________
#if defined(ENVIRONMENTBRDF)
    #ifdef MS_BRDF_ENERGY_CONSERVATION
        var baseSpecularEnergyConservationFactor: vec3f = getEnergyConservationFactor(vec3f(reflectanceF0), environmentBrdf);
        var coloredEnergyConservationFactor: vec3f = getEnergyConservationFactor(specularEnvironmentR0, environmentBrdf);
    #endif
#endif

// _____________________________ Irradiance ______________________________________
#ifdef REFLECTION
    var finalIrradiance: vec3f = reflectionOut.environmentIrradiance;

    // Account for energy loss due to specular reflectance
    var baseSpecularEnergy: vec3f = vec3f(baseSpecularEnvironmentReflectance);
    #if defined(ENVIRONMENTBRDF)
        #ifdef MS_BRDF_ENERGY_CONSERVATION
            baseSpecularEnergy *= baseSpecularEnergyConservationFactor;
        #endif
    #endif
    finalIrradiance *= clamp(vec3f(1.0) - baseSpecularEnergy, vec3f(0.0), vec3f(1.0));
    finalIrradiance *= uniforms.vLightingIntensity.z;
    finalIrradiance *= surfaceAlbedo.rgb;
    finalIrradiance *= aoOut.ambientOcclusionColor;
#endif

// _____________________________ Specular ________________________________________
#ifdef SPECULARTERM
    var finalSpecular: vec3f = specularBase;
    finalSpecular = max(finalSpecular, vec3f(0.0));

    var finalSpecularScaled: vec3f = finalSpecular * uniforms.vLightingIntensity.x * uniforms.vLightingIntensity.w;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalSpecularScaled *= coloredEnergyConservationFactor;
    #endif
#endif

// _____________________________ Radiance ________________________________________
#ifdef REFLECTION
    var finalRadiance: vec3f = reflectionOut.environmentRadiance.rgb;
    finalRadiance *= colorSpecularEnvironmentReflectance;;

    var finalRadianceScaled: vec3f = finalRadiance * uniforms.vLightingIntensity.z;

    #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
        finalRadianceScaled *= coloredEnergyConservationFactor;
    #endif

#endif