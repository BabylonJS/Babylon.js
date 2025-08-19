// _____________________________ Base Diffuse Layer IBL _______________________________________
#ifdef REFLECTION
    // Pass in a vector to sample teh irradiance with (to handle reflection or )
    vec3 baseDiffuseEnvironmentLight = sampleIrradiance(
        normalW
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
            , vEnvironmentIrradiance
        #endif
        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            , reflectionMatrix
        #endif
        #ifdef USEIRRADIANCEMAP
            , irradianceSampler
            #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                , vReflectionDominantDirection
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            , vReflectionFilteringInfo
            #ifdef IBL_CDF_FILTERING
                , icdfSampler
            #endif
        #endif
        , vReflectionInfos
        , viewDirectionW
        , base_diffuse_roughness
        , base_color
    );

    // _____________________________ Base Specular Layer IBL _______________________________________    

    #ifdef REFLECTIONMAP_3D
        vec3 reflectionCoords = vec3(0., 0., 0.);
    #else
        vec2 reflectionCoords = vec2(0., 0.);
    #endif
    reflectionCoords = createReflectionCoords(vPositionW, normalW);
    float specularAlphaG = specular_roughness * specular_roughness;
    vec3 baseSpecularEnvironmentLight = sampleRadiance(specularAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            , baseGeoInfo.NdotVUnclamped
        #endif
        , reflectionSampler
        , reflectionCoords
        #ifdef REALTIME_FILTERING
            , vReflectionFilteringInfo
        #endif
    );

    baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG);

    vec3 coatEnvironmentLight = vec3(0., 0., 0.);
    if (coat_weight > 0.0) {
        #ifdef REFLECTIONMAP_3D
            vec3 reflectionCoords = vec3(0., 0., 0.);
        #else
            vec2 reflectionCoords = vec2(0., 0.);
        #endif
        reflectionCoords = createReflectionCoords(vPositionW, coatNormalW);
        float coatAlphaG = coat_roughness * coat_roughness;
        coatEnvironmentLight = sampleRadiance(coatAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                , coatGeoInfo.NdotVUnclamped
            #endif
            , reflectionSampler
            , reflectionCoords
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
            #endif
        );
    }
    
    // ______________________________ IBL Fresnel Reflectance ____________________________

    // Dielectric IBL Fresnel
    // The colored fresnel represents the % of light reflected by the base specular lobe
    // The non-colored fresnel represents the % of light that doesn't penetrate through 
    // the base specular lobe. i.e. the specular lobe isn't energy conserving for coloured specular.
    float dielectricIblFresnel = getReflectanceFromBRDFLookup(vec3(baseDielectricReflectance.F0), vec3(baseDielectricReflectance.F90), baseGeoInfo.environmentBrdf).r;
    vec3 dielectricIblColoredFresnel = getReflectanceFromBRDFLookup(baseDielectricReflectance.coloredF0, baseDielectricReflectance.coloredF90, baseGeoInfo.environmentBrdf);

    // Conductor IBL Fresnel
    vec3 conductorIblFresnel = conductorIblFresnel(baseConductorReflectance, baseGeoInfo.NdotV, specular_roughness, baseGeoInfo.environmentBrdf);

    // Coat IBL Fresnel
    float coatIblFresnel = 0.0;
    if (coat_weight > 0.0) {
        coatIblFresnel = getReflectanceFromBRDFLookup(vec3(coatReflectance.F0), vec3(coatReflectance.F90), coatGeoInfo.environmentBrdf).r;
    }


    vec3 slab_diffuse_ibl = vec3(0., 0., 0.);
    vec3 slab_glossy_ibl = vec3(0., 0., 0.);
    vec3 slab_metal_ibl = vec3(0., 0., 0.);
    vec3 slab_coat_ibl = vec3(0., 0., 0.);

    slab_diffuse_ibl = baseDiffuseEnvironmentLight * vLightingIntensity.z;
    slab_diffuse_ibl *= aoOut.ambientOcclusionColor;

    // Add the specular environment light
    slab_glossy_ibl = baseSpecularEnvironmentLight * vLightingIntensity.z;
    
    // _____________________________ Metal Layer IBL ____________________________
    slab_metal_ibl = baseSpecularEnvironmentLight * conductorIblFresnel * vLightingIntensity.z;

    // _____________________________ Coat Layer IBL _____________________________
    // We will use this absorption value to darken the underlying layers. It includes both the
    // abosorption of the coat layer and the darkening due to internal reflections.
    vec3 coatAbsorption = vec3(1.0);
    if (coat_weight > 0.0) {
        slab_coat_ibl = coatEnvironmentLight * vLightingIntensity.z;
        
        // __________ Coat Darkening _____________
        // Hemisphere-averaged Fresnel (empirical approximation)
        float hemisphere_avg_fresnel = coatReflectance.F0 + 0.5 * (1.0 - coatReflectance.F0);
        float averageReflectance = (coatIblFresnel + hemisphere_avg_fresnel) * 0.5;
        
        // Account for roughness - rougher surfaces have more diffuse internal reflections
        // This reduces the darkening effect as roughness increases
        float roughnessFactor = 1.0 - coat_roughness * 0.5;
        averageReflectance *= roughnessFactor;

        // Calculate transmission through multiple internal reflections
        // This uses the geometric series for infinite reflections:
        // T = (1-R) / (1 + R + R² + R³ + ...) = (1-R) / (1/(1-R)) = (1-R)²
        float darkened_transmission = (1.0 - averageReflectance) * (1.0 - averageReflectance);
        darkened_transmission = mix(1.0, darkened_transmission, coat_darkening);

        // View-dependent coat absorption.
        // At normal incidence, coat absorption is simply the coat_color.
        // At grazing angles, there is increased darkening and saturation.
        float sin2 = 1.0 - coatGeoInfo.NdotV * coatGeoInfo.NdotV;
        // Divide by the square of the relative IOR (eta) of the incident medium and coat. This
        // is just coat_ior since the incident medium is air (IOR = 1.0).
        sin2 = sin2 / (coat_ior * coat_ior);
        float cos_t = sqrt(1.0 - sin2);
        float coatPathLength = 1.0 / cos_t;
        vec3 colored_transmission = pow(coat_color, vec3(coatPathLength));
        coatAbsorption = mix(vec3(1.0), colored_transmission * darkened_transmission, coat_weight);
    }

    // TEMP
    vec3 slab_subsurface_ibl = vec3(0., 0., 0.);
    vec3 slab_translucent_base_ibl = vec3(0., 0., 0.);
    vec3 slab_fuzz_ibl = vec3(0., 0., 0.);
    
    slab_diffuse_ibl *= base_color.rgb;

    // _____________________________ IBL Material Layer Composition ______________________________________
    #define CUSTOM_FRAGMENT_BEFORE_IBLLAYERCOMPOSITION
    vec3 material_opaque_base_ibl = mix(slab_diffuse_ibl, slab_subsurface_ibl, subsurface_weight);
    vec3 material_dielectric_base_ibl = mix(material_opaque_base_ibl, slab_translucent_base_ibl, transmission_weight);
    vec3 material_dielectric_gloss_ibl = layer(material_dielectric_base_ibl, slab_glossy_ibl, dielectricIblFresnel, vec3(1.0), specular_color);
    vec3 material_base_substrate_ibl = mix(material_dielectric_gloss_ibl, slab_metal_ibl, base_metalness);
    vec3 material_coated_base_ibl = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coatAbsorption, vec3(1.0));
    material_surface_ibl = mix(material_coated_base_ibl, slab_fuzz_ibl, fuzz_weight);
    
#endif