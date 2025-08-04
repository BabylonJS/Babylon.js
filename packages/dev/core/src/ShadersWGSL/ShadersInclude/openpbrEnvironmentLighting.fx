// _____________________________ Base Diffuse Layer IBL _______________________________________
#ifdef REFLECTION
    // Pass in a vector to sample teh irradiance with (to handle reflection or )
    var baseDiffuseEnvironmentLight: vec3f = sampleIrradiance(
        normalW
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
            , vEnvironmentIrradiance //SH
        #endif
        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            , uniforms.reflectionMatrix
        #endif
        #ifdef USEIRRADIANCEMAP
            , irradianceSampler
            , irradianceSamplerSampler
            #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                , uniforms.vReflectionDominantDirection
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            , uniforms.vReflectionFilteringInfo
            #ifdef IBL_CDF_FILTERING
                , icdfSampler
                , icdfSamplerSampler
            #endif
        #endif
        , uniforms.vReflectionInfos
        , viewDirectionW
        , base_diffuse_roughness
        , base_color
    );

    // _____________________________ Base Specular Layer IBL _______________________________________    

    #ifdef REFLECTIONMAP_3D
        var reflectionCoords: vec3f = vec3f(0.f, 0.f, 0.f);
    #else
        var reflectionCoords: vec2f = vec2f(0.f, 0.f);
    #endif
    reflectionCoords = createReflectionCoords(fragmentInputs.vPositionW, normalW);
    let specularAlphaG: f32 = specular_roughness * specular_roughness;
    var baseSpecularEnvironmentLight: vec3f = sampleRadiance(specularAlphaG, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            , baseGeoInfo.NdotVUnclamped
        #endif
        , reflectionSampler
        , reflectionSamplerSampler
        , reflectionCoords
        #ifdef REALTIME_FILTERING
            , uniforms.vReflectionFilteringInfo
        #endif
    );

    baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG);

    var coatEnvironmentLight: vec3f = vec3f(0.f, 0.f, 0.f);
    if (coat_weight > 0.0) {
        #ifdef REFLECTIONMAP_3D
            var reflectionCoords: vec3f = vec3f(0.f, 0.f, 0.f);
        #else
            var reflectionCoords: vec2f = vec2f(0.f, 0.f);
        #endif
        reflectionCoords = createReflectionCoords(fragmentInputs.vPositionW, coatNormalW);
        var coatAlphaG: f32 = coat_roughness * coat_roughness;
        coatEnvironmentLight = sampleRadiance(coatAlphaG, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                , coatGeoInfo.NdotVUnclamped
            #endif
            , reflectionSampler
            , reflectionSamplerSampler
            , reflectionCoords
            #ifdef REALTIME_FILTERING
                , uniforms.vReflectionFilteringInfo
            #endif
        );
    }
    
    // ______________________________ IBL Fresnel Reflectance ____________________________

    // Dielectric IBL Fresnel
    // The colored fresnel represents the % of light reflected by the base specular lobe
    // The non-colored fresnel represents the % of light that doesn't penetrate through 
    // the base specular lobe. i.e. the specular lobe isn't energy conserving for coloured specular.
    let dielectricIblFresnel: f32 = getReflectanceFromBRDFWithEnvLookup(vec3f(baseDielectricReflectance.F0), vec3f(baseDielectricReflectance.F90), baseGeoInfo.environmentBrdf).r;
    let dielectricIblColoredFresnel: vec3f = getReflectanceFromBRDFWithEnvLookup(baseDielectricReflectance.coloredF0, baseDielectricReflectance.coloredF90, baseGeoInfo.environmentBrdf);

    // Conductor IBL Fresnel
    let conductorIblFresnel: vec3f = conductorIblFresnel(baseConductorReflectance, baseGeoInfo.NdotV, specular_roughness, baseGeoInfo.environmentBrdf);

    // Coat IBL Fresnel
    var coatIblFresnel: f32 = 0.0;
    if (coat_weight > 0.0) {
        coatIblFresnel = getReflectanceFromBRDFWithEnvLookup(vec3f(coatReflectance.F0), vec3f(coatReflectance.F90), coatGeoInfo.environmentBrdf).r;
    }


    var slab_diffuse_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_glossy_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_metal_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_coat_ibl: vec3f = vec3f(0., 0., 0.);

    slab_diffuse_ibl = baseDiffuseEnvironmentLight * uniforms.vLightingIntensity.z;
    slab_diffuse_ibl *= aoOut.ambientOcclusionColor;

    // Add the specular environment light
    slab_glossy_ibl = baseSpecularEnvironmentLight * uniforms.vLightingIntensity.z;

    // _____________________________ Metal Layer IBL ____________________________
    slab_metal_ibl = baseSpecularEnvironmentLight * conductorIblFresnel * uniforms.vLightingIntensity.z;

    // _____________________________ Coat Layer IBL _____________________________
    if (coat_weight > 0.0) {
        slab_coat_ibl = coatEnvironmentLight * uniforms.vLightingIntensity.z;
    }

    // TEMP
    var slab_subsurface_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_translucent_base_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_fuzz_ibl: vec3f = vec3f(0., 0., 0.);

    slab_diffuse_ibl *= base_color.rgb;

    // _____________________________ IBL Material Layer Composition ______________________________________
    #define CUSTOM_FRAGMENT_BEFORE_IBLLAYERCOMPOSITION
    let material_opaque_base_ibl: vec3f = mix(slab_diffuse_ibl, slab_subsurface_ibl, subsurface_weight);
    let material_dielectric_base_ibl: vec3f = mix(material_opaque_base_ibl, slab_translucent_base_ibl, transmission_weight);
    let material_dielectric_gloss_ibl: vec3f = layer(material_dielectric_base_ibl, slab_glossy_ibl, dielectricIblFresnel, vec3f(1.0f), specular_color);
    let material_base_substrate_ibl: vec3f = mix(material_dielectric_gloss_ibl, slab_metal_ibl, base_metalness);
    let material_coated_base_ibl: vec3f = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coat_color, vec3f(1.0f));
    material_surface_ibl = mix(material_coated_base_ibl, slab_fuzz_ibl, fuzz_weight);
    
#endif