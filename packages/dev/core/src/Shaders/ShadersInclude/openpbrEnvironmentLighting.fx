// _____________________________ Base Diffuse Layer IBL _______________________________________
#ifdef REFLECTION

    #ifdef FUZZ
        vec3 environmentFuzzBrdf = getFuzzBRDFLookup(fuzzGeoInfo.NdotV, sqrt(fuzz_roughness));
    #endif

    // Pass in a vector to sample the irradiance with. A normal can be used for
    // diffuse irradiance while a refracted vector can be used for diffuse transmission.
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

    float specularAlphaG = specular_roughness * specular_roughness;
    #ifdef ANISOTROPIC_BASE
        vec3 baseSpecularEnvironmentLight = sampleRadianceAnisotropic(specularAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
            , baseGeoInfo
            , normalW
            , viewDirectionW
            , vPositionW
            , noise
            , false // isRefraction
            , 1.0 // ior (not used for reflection)
            , reflectionSampler
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
            #endif
        );
    #else
        reflectionCoords = createReflectionCoords(vPositionW, normalW);
        vec3 baseSpecularEnvironmentLight = sampleRadiance(specularAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
            , baseGeoInfo
            , reflectionSampler
            , reflectionCoords
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
            #endif
        );
    #endif

    // Purely empirical blend between diffuse and specular lobes when roughness gets very high.
    #ifdef ANISOTROPIC_BASE
        baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG * specularAlphaG * max(1.0 - baseGeoInfo.anisotropy, 0.3));
    #else
        baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG);
    #endif

    vec3 coatEnvironmentLight = vec3(0., 0., 0.);
    if (coat_weight > 0.0) {
        #ifdef REFLECTIONMAP_3D
            vec3 reflectionCoords = vec3(0., 0., 0.);
        #else
            vec2 reflectionCoords = vec2(0., 0.);
        #endif
        reflectionCoords = createReflectionCoords(vPositionW, coatNormalW);
        float coatAlphaG = coat_roughness * coat_roughness;
        #ifdef ANISOTROPIC_COAT
            coatEnvironmentLight = sampleRadianceAnisotropic(coatAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                , coatGeoInfo
                , coatNormalW
                , viewDirectionW
                , vPositionW
                , noise
                , false // isRefraction
                , 1.0 // ior (not used for reflection)
                , reflectionSampler
                #ifdef REALTIME_FILTERING
                    , vReflectionFilteringInfo
                #endif
            );
        #else
            coatEnvironmentLight = sampleRadiance(coatAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                , coatGeoInfo
                , reflectionSampler
                , reflectionCoords
                #ifdef REALTIME_FILTERING
                    , vReflectionFilteringInfo
                #endif
            );
        #endif
    }

    #ifdef FUZZ
        // _____________________________ Fuzz Layer IBL _______________________________________
        
        // From the LUT, the y component represents a slight skewing of the lobe. I'm using this to
        // bump the roughness up slightly.
        float modifiedFuzzRoughness = clamp(fuzz_roughness * (1.0 - 0.5 * environmentFuzzBrdf.y), 0.0, 1.0);
        
        // The x component of the LUT, represents the anisotropy of the lobe (0 being anisotropic, 1 being isotropic)
        // We'll do a simple approximation by sampling the environment multiple times around an imaginary fiber.
        // This will be scaled by the anisotropy value from the LUT so that, for isotropic fuzz, we just use the surface normal.
        vec3 fuzzEnvironmentLight = vec3(0.0);
        float totalWeight = 0.0;
        float fuzzIblFresnel = sqrt(environmentFuzzBrdf.z);
        for (int i = 0; i < FUZZ_IBL_SAMPLES; ++i) {
            float angle = (float(i) + noise.x) * (3.141592 * 2.0 / float(FUZZ_IBL_SAMPLES));
            // Normal of the fiber is a simple rotation of the tangent and bitangent around the surface normal
            vec3 fiberCylinderNormal = normalize(cos(angle) * fuzzTangent + sin(angle) * fuzzBitangent);
            // Then, we mix it with the fuzz surface normal based on the anisotropy from the LUT and the fuzz
            // roughness. When the fibers are more aligned, we get higher anisotropy.
            float fiberBend = min(environmentFuzzBrdf.x * environmentFuzzBrdf.x * modifiedFuzzRoughness, 1.0);
            fiberCylinderNormal = normalize(mix(fiberCylinderNormal, fuzzNormalW, fiberBend));
            float sampleWeight = max(dot(viewDirectionW, fiberCylinderNormal), 0.0);
            vec3 fuzzReflectionCoords = createReflectionCoords(vPositionW, fiberCylinderNormal);
            vec3 radianceSample = sampleRadiance(modifiedFuzzRoughness, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                , fuzzGeoInfo
                , reflectionSampler
                , fuzzReflectionCoords
                #ifdef REALTIME_FILTERING
                    , vReflectionFilteringInfo
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

    float dielectricIblFresnel = getReflectanceFromBRDFLookup(vec3(baseDielectricReflectance.F0), vec3(baseDielectricReflectance.F90), baseGeoInfo.environmentBrdf).r;
    vec3 dielectricIblColoredFresnel = dielectricIblFresnel * specular_color;
    #ifdef THIN_FILM
        vec3 thinFilmDielectricFresnel = evalIridescence(thin_film_outside_ior, thin_film_ior, baseGeoInfo.NdotV, thin_film_thickness, baseDielectricReflectance.coloredF0);
        // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
        // closer to path-tracing reference.
        float thin_film_desaturation_scale = (thin_film_ior - 1.0) * sqrt(thin_film_thickness * 0.001 * baseGeoInfo.NdotV);
        thinFilmDielectricFresnel = mix(thinFilmDielectricFresnel, vec3(dot(thinFilmDielectricFresnel, vec3(0.3333))), thin_film_desaturation_scale);
        dielectricIblColoredFresnel = mix(dielectricIblColoredFresnel, thinFilmDielectricFresnel * specular_color, thin_film_weight * thin_film_ior_scale);
    #endif

    // Conductor IBL Fresnel
    vec3 conductorIblFresnel = conductorIblFresnel(baseConductorReflectance, baseGeoInfo.NdotV, specular_roughness, baseGeoInfo.environmentBrdf);
    #ifdef THIN_FILM
        vec3 thinFilmConductorFresnel = specular_weight * evalIridescence(thin_film_outside_ior, thin_film_ior, baseGeoInfo.NdotV, thin_film_thickness, baseConductorReflectance.coloredF0);
        thinFilmConductorFresnel = mix(thinFilmConductorFresnel, vec3(dot(thinFilmConductorFresnel, vec3(0.3333))), thin_film_desaturation_scale);
        conductorIblFresnel = mix(conductorIblFresnel, thinFilmConductorFresnel, thin_film_weight * thin_film_ior_scale);
    #endif

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
    
    #ifdef AMBIENT_OCCLUSION
        specular_ambient_occlusion = compute_specular_occlusion(baseGeoInfo.NdotV, base_metalness, ambient_occlusion.x, specular_roughness);
    #endif

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

        #ifdef AMBIENT_OCCLUSION
            coat_specular_ambient_occlusion = compute_specular_occlusion(coatGeoInfo.NdotV, 0.0, ambient_occlusion.x, coat_roughness);
        #endif
        
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

    #ifdef FUZZ
        vec3 slab_fuzz_ibl = fuzzEnvironmentLight * vLightingIntensity.z;
    #endif

    vec3 slab_translucent_base_ibl = slab_translucent_background.rgb * transmission_absorption;
    #ifdef REFRACTED_ENVIRONMENT
        
        #ifdef ANISOTROPIC_BASE
            vec3 environmentRefraction = sampleRadianceAnisotropic(roughness_alpha_modified_for_scatter, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                , baseGeoInfo
                , normalW
                , viewDirectionW
                , vPositionW
                , noise
                , true // isRefraction
                , specular_ior // Used for refraction
                , reflectionSampler
                #ifdef REALTIME_FILTERING
                    , vReflectionFilteringInfo
                #endif
            );
        #else
            vec3 environmentRefraction = vec3(0., 0., 0.);
            #ifdef DISPERSION
                for (int i = 0; i < 3; i++) {
                    vec3 iblRefractionCoords = refractedViewVectors[i];
            #else
                vec3 iblRefractionCoords = refractedViewVector;
            #endif
            #ifdef REFRACTED_ENVIRONMENT_OPPOSITEZ
                iblRefractionCoords.z *= -1.0;
            #endif
            #ifdef REFRACTED_ENVIRONMENT_LOCAL_CUBE
                iblRefractionCoords = parallaxCorrectNormal(vPositionW, refractedViewVector, refractionSize, refractionPosition);
            #endif

            iblRefractionCoords = vec3(reflectionMatrix * vec4(iblRefractionCoords, 0));
            #ifdef DISPERSION
                environmentRefraction[i] = sampleRadiance(roughness_alpha_modified_for_scatter, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                    , baseGeoInfo
                    , reflectionSampler
                    , iblRefractionCoords
                    #ifdef REALTIME_FILTERING
                        , vReflectionFilteringInfo
                    #endif
                )[i];
            #else
                environmentRefraction = sampleRadiance(roughness_alpha_modified_for_scatter, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                    , baseGeoInfo
                    , reflectionSampler
                    , iblRefractionCoords
                    #ifdef REALTIME_FILTERING
                        , vReflectionFilteringInfo
                    #endif
                );
            #endif
            #ifdef DISPERSION
                }
            #endif
            // environmentRefraction *= transmission_absorption;
        #endif
        #ifdef REFRACTED_BACKGROUND
            // Scale the refraction so that we only see it at higher roughnesses
            // This is because we're adding this to the refraction map which should take priority
            // at low blurriness since it represents the transmitted light that is in front of the IBL.
            // At high blurriness, the refraction from the environment will be coming from more directions
            // and so we want to include more of this indirect lighting.
            environmentRefraction *= max(roughness_alpha_modified_for_scatter * roughness_alpha_modified_for_scatter - 0.1, 0.0);
        #endif

        #ifdef SCATTERING
            // Isotropic Scattering
            
            #if defined(USEIRRADIANCEMAP) && defined(USE_IRRADIANCE_DOMINANT_DIRECTION)
                vec3 scatterVector = mix(vReflectionDominantDirection, normalW, max3(iso_scatter_density));
            #else
                vec3 scatterVector = normalW;
            #endif

            // Backscattering can be approximated by sampling IBL along the view vector.
            scatterVector = mix(viewDirectionW, scatterVector, back_to_iso_scattering_blend);
            vec3 scatteredEnvironmentLight = sampleIrradiance(
                scatterVector
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
                , 1.0
                , multi_scatter_color
            );

            if (transmission_depth>0.0) {
                // Direct Transmission (aka forward-scattered light from back side)
                vec3 forward_scattered_light = environmentRefraction * transmission_absorption;
                // Back Scattering
                vec3 back_scattered_light = mix(forward_scattered_light, scatteredEnvironmentLight * absorption_at_mfp, iso_scatter_density);
                // Iso Scattering
                vec3 iso_scattered_light = mix(forward_scattered_light, scatteredEnvironmentLight * multi_scatter_color, iso_scatter_density);

                // Lerp between the three based on the anisotropy
                slab_translucent_base_ibl = mix(back_scattered_light, iso_scattered_light, back_to_iso_scattering_blend);
                slab_translucent_base_ibl = mix(slab_translucent_base_ibl, forward_scattered_light, iso_to_forward_scattering_blend);
            } else {
                slab_translucent_base_ibl += environmentRefraction.rgb;
            }
        #else
            slab_translucent_base_ibl += environmentRefraction * transmission_absorption;
        #endif
    #endif

    // TEMP
    vec3 slab_subsurface_ibl = vec3(0., 0., 0.);
    
    
    slab_diffuse_ibl *= base_color.rgb;

    // _____________________________ IBL Material Layer Composition ______________________________________
    #define CUSTOM_FRAGMENT_BEFORE_IBLLAYERCOMPOSITION

    slab_diffuse_ibl *= ambient_occlusion;
    slab_metal_ibl *= specular_ambient_occlusion;
    slab_glossy_ibl *= specular_ambient_occlusion;
    slab_coat_ibl *= coat_specular_ambient_occlusion;

    vec3 material_opaque_base_ibl = mix(slab_diffuse_ibl, slab_subsurface_ibl, subsurface_weight);
    vec3 material_dielectric_base_ibl = mix(material_opaque_base_ibl, slab_translucent_base_ibl, transmission_weight);
    vec3 material_dielectric_gloss_ibl = material_dielectric_base_ibl * (1.0 - dielectricIblFresnel) + slab_glossy_ibl * dielectricIblColoredFresnel;
    vec3 material_base_substrate_ibl = mix(material_dielectric_gloss_ibl, slab_metal_ibl, base_metalness);
    vec3 material_coated_base_ibl = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coatAbsorption, vec3(1.0));
    #ifdef FUZZ
    slab_fuzz_ibl *= ambient_occlusion;
    material_surface_ibl = layer(material_coated_base_ibl, slab_fuzz_ibl, fuzzIblFresnel * fuzz_weight, vec3(1.0), fuzz_color);
    #else
    material_surface_ibl = material_coated_base_ibl;
    #endif
    
#endif