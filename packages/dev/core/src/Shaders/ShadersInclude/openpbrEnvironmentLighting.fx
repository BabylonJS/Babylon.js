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
    if (coat_weight > 0.0) {
        slab_coat_ibl = coatEnvironmentLight * vLightingIntensity.z;
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
    vec3 material_coated_base_ibl = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coat_color, vec3(1.0));
    material_surface_ibl = mix(material_coated_base_ibl, slab_fuzz_ibl, fuzz_weight);
    
#endif