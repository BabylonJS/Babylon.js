// _____________________________ Base Diffuse Layer IBL _______________________________________
#ifdef REFLECTION

    #ifdef FUZZ
        let environmentFuzzBrdf: vec3f = getFuzzBRDFLookup(fuzzGeoInfo.NdotV, sqrt(fuzz_roughness));
    #endif

    // Pass in a vector to sample the irradiance with. A normal can be used for
    // diffuse irradiance while a refracted vector can be used for diffuse transmission.
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
    
    let specularAlphaG: f32 = specular_roughness * specular_roughness;

    #ifdef ANISOTROPIC_BASE
        var baseSpecularEnvironmentLight: vec3f = sampleRadianceAnisotropic(specularAlphaG, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
            , baseGeoInfo
            , normalW
            , viewDirectionW
            , fragmentInputs.vPositionW
            , noise
            , reflectionSampler
            , reflectionSamplerSampler
            #ifdef REALTIME_FILTERING
                , uniforms.vReflectionFilteringInfo
            #endif
        );
    #else
        reflectionCoords = createReflectionCoords(fragmentInputs.vPositionW, normalW);
        var baseSpecularEnvironmentLight: vec3f = sampleRadiance(specularAlphaG, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
            , baseGeoInfo
            , reflectionSampler
            , reflectionSamplerSampler
            , reflectionCoords
            #ifdef REALTIME_FILTERING
                , uniforms.vReflectionFilteringInfo
            #endif
        );
    #endif

    // Purely empirical blend between diffuse and specular lobes when roughness gets very high.
    #ifdef ANISOTROPIC_BASE
        baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG * specularAlphaG  * max(1.0f - baseGeoInfo.anisotropy, 0.3f));
    #else
        baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG);
    #endif

    var coatEnvironmentLight: vec3f = vec3f(0.f, 0.f, 0.f);
    if (coat_weight > 0.0) {
        #ifdef REFLECTIONMAP_3D
            var reflectionCoords: vec3f = vec3f(0.f, 0.f, 0.f);
        #else
            var reflectionCoords: vec2f = vec2f(0.f, 0.f);
        #endif
        reflectionCoords = createReflectionCoords(fragmentInputs.vPositionW, coatNormalW);
        var coatAlphaG: f32 = coat_roughness * coat_roughness;
        #ifdef ANISOTROPIC_COAT
            coatEnvironmentLight = sampleRadianceAnisotropic(coatAlphaG, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
                , coatGeoInfo
                , coatNormalW
                , viewDirectionW
                , fragmentInputs.vPositionW
                , noise
                , reflectionSampler
                , reflectionSamplerSampler
                #ifdef REALTIME_FILTERING
                    , uniforms.vReflectionFilteringInfo
                #endif
            );
        #else
            coatEnvironmentLight = sampleRadiance(coatAlphaG, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
                , coatGeoInfo
                , reflectionSampler
                , reflectionSamplerSampler
                , reflectionCoords
                #ifdef REALTIME_FILTERING
                    , uniforms.vReflectionFilteringInfo
                #endif
            );
        #endif
    }

    #ifdef FUZZ
        // _____________________________ Fuzz Layer IBL _______________________________________
        
        // From the LUT, the y component represents a slight skewing of the lobe. I'm using this to
        // bump the roughness up slightly.
        let modifiedFuzzRoughness: f32 = clamp(fuzz_roughness * (1.0f - 0.5f * environmentFuzzBrdf.y), 0.0f, 1.0f);
        
        // The x component of the LUT, represents the anisotropy of the lobe (0 being anisotropic, 1 being isotropic)
        // We'll do a simple approximation by sampling the environment multiple times around an imaginary fiber.
        // This will be scaled by the anisotropy value from the LUT so that, for isotropic fuzz, we just use the surface normal.
        var fuzzEnvironmentLight = vec3f(0.0f, 0.0f, 0.0f);
        var totalWeight = 0.0f;
        let fuzzIblFresnel: f32 = sqrt(environmentFuzzBrdf.z);
        for (var i: i32 = 0; i < i32(FUZZ_IBL_SAMPLES); i++) {
            var angle: f32 = (f32(i) + noise.x) * (3.141592f * 2.0f / f32(FUZZ_IBL_SAMPLES));
            // Normal of the fiber is a simple rotation of the tangent and bitangent around the surface normal
            var fiberCylinderNormal: vec3f = normalize(cos(angle) * fuzzTangent + sin(angle) * fuzzBitangent);
            // Then, we mix it with the fuzz surface normal based on the anisotropy from the LUT and the fuzz
            // roughness. When the fibers are more aligned, we get higher anisotropy.
            let fiberBend = min(environmentFuzzBrdf.x * environmentFuzzBrdf.x * modifiedFuzzRoughness, 1.0f);
            fiberCylinderNormal = normalize(mix(fiberCylinderNormal, fuzzNormalW, fiberBend));
            let sampleWeight = max(dot(viewDirectionW, fiberCylinderNormal), 0.0f);
            var fuzzReflectionCoords = createReflectionCoords(fragmentInputs.vPositionW, fiberCylinderNormal);
            let radianceSample: vec3f = sampleRadiance(modifiedFuzzRoughness, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
                , fuzzGeoInfo
                , reflectionSampler
                , reflectionSamplerSampler
                , fuzzReflectionCoords
                #ifdef REALTIME_FILTERING
                    , uniforms.vReflectionFilteringInfo
                #endif
            );
            // As we get closer to bending the normal back towards the regular surface normal, the fuzz is
            // also rougher, so we blend more towards the diffuse environment light.
            fuzzEnvironmentLight += sampleWeight * mix(radianceSample, baseDiffuseEnvironmentLight, fiberBend);
            totalWeight += sampleWeight;
        }
        fuzzEnvironmentLight /= totalWeight;
    #endif
    
    // ______________________________ IBL Fresnel Reflectance ____________________________

    // Dielectric IBL Fresnel
    // The colored fresnel represents the % of light reflected by the base specular lobe
    // The non-colored fresnel represents the % of light that doesn't penetrate through 
    // the base specular lobe. i.e. the specular lobe isn't energy conserving for coloured specular.
    let dielectricIblFresnel: f32 = getReflectanceFromBRDFWithEnvLookup(vec3f(baseDielectricReflectance.F0), vec3f(baseDielectricReflectance.F90), baseGeoInfo.environmentBrdf).r;
    var dielectricIblColoredFresnel: vec3f = dielectricIblFresnel * specular_color;
    #ifdef THIN_FILM
        // Scale the thin film effect based on how different the IOR is from 1.0 (no thin film effect)
        let thinFilmIorScale: f32 = clamp(2.0f * abs(thin_film_ior - 1.0f), 0.0f, 1.0f);
        var thin_film_dielectric: vec3f = evalIridescence(thin_film_outside_ior, thin_film_ior, baseGeoInfo.NdotV, thin_film_thickness, baseDielectricReflectance.coloredF0);
        let thin_film_desaturation_scale = (thin_film_ior - 1.0) * sqrt(thin_film_thickness * 0.001f * baseGeoInfo.NdotV);
        thin_film_dielectric = mix(thin_film_dielectric, vec3(dot(thin_film_dielectric, vec3f(0.3333f))), thin_film_desaturation_scale);
        dielectricIblColoredFresnel = mix(dielectricIblColoredFresnel, thin_film_dielectric * specular_color, thin_film_weight * thinFilmIorScale);
    #endif

    // Conductor IBL Fresnel
    var conductorIblFresnel: vec3f = conductorIblFresnel(baseConductorReflectance, baseGeoInfo.NdotV, specular_roughness, baseGeoInfo.environmentBrdf);
    #ifdef THIN_FILM
        var thinFilmConductorFresnel: vec3f = specular_weight * evalIridescence(thin_film_outside_ior, thin_film_ior, baseGeoInfo.NdotV, thin_film_thickness, baseConductorReflectance.coloredF0);
        thinFilmConductorFresnel = mix(thinFilmConductorFresnel, vec3(dot(thinFilmConductorFresnel, vec3f(0.3333f))), thin_film_desaturation_scale);
        conductorIblFresnel = mix(conductorIblFresnel, thinFilmConductorFresnel, thin_film_weight * thinFilmIorScale);
    #endif

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
    var coatAbsorption = vec3f(1.0);
    if (coat_weight > 0.0) {
        slab_coat_ibl = coatEnvironmentLight * uniforms.vLightingIntensity.z;
        
        // __________ Coat Darkening _____________
        // Hemisphere-averaged Fresnel (empirical approximation)
        let hemisphere_avg_fresnel: f32 = coatReflectance.F0 + 0.5f * (1.0f - coatReflectance.F0);
        var averageReflectance: f32 = (coatIblFresnel + hemisphere_avg_fresnel) * 0.5f;

        // Account for roughness - rougher surfaces have more diffuse internal reflections
        // This reduces the darkening effect as roughness increases
        let roughnessFactor = 1.0f - coat_roughness * 0.5f;
        averageReflectance *= roughnessFactor;

        // Calculate transmission through multiple internal reflections
        // This uses the geometric series for infinite reflections:
        // T = (1-R) / (1 + R + R² + R³ + ...) = (1-R) / (1/(1-R)) = (1-R)²
        var darkened_transmission: f32 = (1.0f - averageReflectance) * (1.0f - averageReflectance);
        darkened_transmission = mix(1.0, darkened_transmission, coat_darkening);

        // View-dependent coat absorption.
        // At normal incidence, coat absorption is simply the coat_color.
        // At grazing angles, there is increased darkening and saturation.
        var sin2: f32 = 1.0f - coatGeoInfo.NdotV * coatGeoInfo.NdotV;
        // Divide by the square of the relative IOR (eta) of the incident medium and coat. This
        // is just coat_ior since the incident medium is air (IOR = 1.0).
        sin2 = sin2 / (coat_ior * coat_ior);
        let cos_t: f32 = sqrt(1.0f - sin2);
        let coatPathLength = 1.0f / cos_t;
        let colored_transmission: vec3f = pow(coat_color, vec3f(coatPathLength));
        coatAbsorption = mix(vec3f(1.0f), colored_transmission * vec3f(darkened_transmission), coat_weight);
    }

    #ifdef FUZZ
        let slab_fuzz_ibl = fuzzEnvironmentLight * uniforms.vLightingIntensity.z;
    #endif

    // TEMP
    var slab_subsurface_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_translucent_base_ibl: vec3f = vec3f(0., 0., 0.);

    slab_diffuse_ibl *= base_color.rgb;

    // _____________________________ IBL Material Layer Composition ______________________________________
    #define CUSTOM_FRAGMENT_BEFORE_IBLLAYERCOMPOSITION
    let material_opaque_base_ibl: vec3f = mix(slab_diffuse_ibl, slab_subsurface_ibl, subsurface_weight);
    let material_dielectric_base_ibl: vec3f = mix(material_opaque_base_ibl, slab_translucent_base_ibl, transmission_weight);
    let material_dielectric_gloss_ibl: vec3f = material_dielectric_base_ibl * (1.0 - dielectricIblFresnel) + slab_glossy_ibl * dielectricIblColoredFresnel;
    let material_base_substrate_ibl: vec3f = mix(material_dielectric_gloss_ibl, slab_metal_ibl, base_metalness);
    let material_coated_base_ibl: vec3f = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coatAbsorption, vec3f(1.0f));
    #ifdef FUZZ
    material_surface_ibl = layer(material_coated_base_ibl, slab_fuzz_ibl, fuzzIblFresnel * fuzz_weight, vec3(1.0), fuzz_color);
    #else
    material_surface_ibl = material_coated_base_ibl;
    #endif
    
#endif