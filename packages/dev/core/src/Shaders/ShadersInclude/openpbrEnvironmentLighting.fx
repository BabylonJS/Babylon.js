#if defined(REFLECTION) || defined(REFRACTED_BACKGROUND)

    // _____________________________ Coat Layer IBL _____________________________
    // We will use this absorption value to darken the underlying layers. It includes both the
    // abosorption of the coat layer and the darkening due to internal reflections.
    vec3 coatAbsorption = vec3(1.0);

    // Coat IBL Fresnel
    float coatIblFresnel = 0.0;
    if (coat_weight > 0.0) {
        coatIblFresnel = computeDielectricIblFresnel(coatReflectance, coatGeoInfo.environmentBrdf);
    
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
#endif
// _____________________________ Base Diffuse Layer IBL _______________________________________
#ifdef REFLECTION

    #if defined(FUZZ) && defined(FUZZENVIRONMENTBRDF)
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

    #if defined(FUZZ) &&defined(FUZZENVIRONMENTBRDF)
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

    float dielectricIblFresnel = computeDielectricIblFresnel(baseDielectricReflectance, baseGeoInfo.environmentBrdf);
    vec3 dielectricIblColoredFresnel = dielectricIblFresnel * specular_color;
    #ifdef THIN_FILM
        // For rough surfaces, the GGX microfacet distribution means VdotH never truly reaches 0
        // even at grazing NdotV. Using NdotV directly causes evalIridescence to return near-white
        // at glancing angles for any roughness, which is incorrect. Clamping to the GGX alpha
        // (specular_roughness^2) prevents this: smooth surfaces are unaffected (alpha≈0) while
        // rough surfaces retain colored interference fringes at glancing view angles.
        float thin_film_cos_theta = max(baseGeoInfo.NdotV, specularAlphaG);
        // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
        // closer to path-tracing reference.
        float thin_film_desaturation_scale = (thin_film_ior - 1.0) * sqrt(thin_film_thickness * 0.001 * thin_film_cos_theta);
        // Shared BRDF LUT values for thin film energy conservation.
        // brdf.x = integral of (F90-F0) Schlick factor; brdf.y = E_ss (white Fresnel integral).
        float tf_brdf_x = baseGeoInfo.environmentBrdf.x;
        float tf_E_ss   = baseGeoInfo.environmentBrdf.y;

        // evalIridescence recovers IOR from baseDielectricReflectance.F0 internally.
        // F0 already bakes in specular_weight as mix(0, F0_ior, weight), so the
        // specular_weight → thin-film-strength relationship is preserved. The maxR1
        // guard inside evalIridescence suppresses spurious colour when film IOR matches
        // the substrate IOR (e.g. specular_ior == thin_film_ior at weight=1).
        // Normal-incidence evaluation provides the energy-correct F0 magnitude for the split-sum.
        // Using an angle-dependent value as F0 inflates the split-sum integral because Schlick F90=1
        // makes the Fresnel climb toward 1 at grazing angles.
        vec3 thinFilmDielectricF0 = evalIridescence(thin_film_outside_ior, thin_film_ior, 1.0, thin_film_thickness, vec3(baseDielectricReflectance.F0));
        thinFilmDielectricF0 = mix(thinFilmDielectricF0, vec3(dot(thinFilmDielectricF0, vec3(0.3333))), thin_film_desaturation_scale);
        // Angle-dependent evaluation preserves the NdotV-varying colour shift characteristic of thin films.
        vec3 thinFilmDielectricDir = evalIridescence(thin_film_outside_ior, thin_film_ior, thin_film_cos_theta, thin_film_thickness, vec3(baseDielectricReflectance.F0));
        thinFilmDielectricDir = mix(thinFilmDielectricDir, vec3(dot(thinFilmDielectricDir, vec3(0.3333))), thin_film_desaturation_scale);
        // Combine: rescale the directional evaluation's per-channel colour ratios to the F0 average
        // magnitude. avg(thinFilmDielectricFresnel) == avg(thinFilmDielectricF0), so the split-sum
        // energy matches the normal-incidence baseline while the colour varies correctly with NdotV.
        float tf_f0d_avg  = dot(thinFilmDielectricF0,  vec3(0.3333));
        float tf_dird_avg = dot(thinFilmDielectricDir, vec3(0.3333));
        vec3 thinFilmDielectricFresnel = thinFilmDielectricDir * (tf_f0d_avg / max(tf_dird_avg, 1e-5));
        vec3 tf_E_dielectric = (vec3(1.0) - thinFilmDielectricFresnel) * vec3(tf_brdf_x) + thinFilmDielectricFresnel * vec3(tf_E_ss);
        vec3 tf_F_avg_dielectric = thinFilmDielectricFresnel + (vec3(1.0) - thinFilmDielectricFresnel) / 21.0;
        vec3 tf_ECF_dielectric = vec3(1.0) + tf_F_avg_dielectric * (vec3(1.0) / vec3(tf_E_ss) - vec3(1.0));
        thinFilmDielectricFresnel = clamp(tf_E_dielectric * tf_ECF_dielectric, vec3(0.0), vec3(1.0));
        dielectricIblColoredFresnel = mix(dielectricIblColoredFresnel, thinFilmDielectricFresnel * specular_color, thin_film_weight * thin_film_ior_scale);
        // Furnace-test fix: the scalar dielectricIblFresnel controls diffuse suppression at line 436
        // via (1 - F) * diffuse + F_colored * specular. If F_colored > F_scalar, energy is gained.
        // Clamp scalar to max channel of colored to guarantee energy conservation in all channels.
        dielectricIblFresnel = max(dielectricIblColoredFresnel.r, max(dielectricIblColoredFresnel.g, dielectricIblColoredFresnel.b));
    #endif

    // Conductor IBL Fresnel
    vec3 conductorIblFresnel = computeConductorIblFresnel(baseConductorReflectance, baseGeoInfo.environmentBrdf);
    #ifdef THIN_FILM
        // Conductor thin film — keep using coloredF0 (no scalar IOR available for metals).
        // Normal-incidence F0 for energy-correct split-sum magnitude.
        vec3 thinFilmConductorF0 = evalIridescence(thin_film_outside_ior, thin_film_ior, 1.0, thin_film_thickness, baseConductorReflectance.coloredF0);
        thinFilmConductorF0 = mix(thinFilmConductorF0, vec3(dot(thinFilmConductorF0, vec3(0.3333))), thin_film_desaturation_scale);
        // Angle-dependent evaluation for NdotV-varying colour.
        vec3 thinFilmConductorDir = evalIridescence(thin_film_outside_ior, thin_film_ior, thin_film_cos_theta, thin_film_thickness, baseConductorReflectance.coloredF0);
        thinFilmConductorDir = mix(thinFilmConductorDir, vec3(dot(thinFilmConductorDir, vec3(0.3333))), thin_film_desaturation_scale);
        // Rescale directional colour ratios to F0 magnitude — energy-correct while preserving colour variation.
        float tf_f0c_avg  = dot(thinFilmConductorF0,  vec3(0.3333));
        float tf_dirc_avg = dot(thinFilmConductorDir, vec3(0.3333));
        vec3 thinFilmConductorRaw = thinFilmConductorDir * (tf_f0c_avg / max(tf_dirc_avg, 1e-5));
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR) && defined(ENVIRONMENTBRDF)
            // computeConductorIblFresnel uses getF82DirectionalAlbedo which includes -b*brdf.z (the
            // F82 dip term). The plain Schlick split-sum has no such term, so when specular_color !=
            // white (b > 0), the thin film integral is higher than the conductor baseline — causing the
            // "stronger F90" seen in IBL. Apply the same b-correction to stay energy-consistent.
            vec3 tf_b = getF82B(baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
            float tf_brdf_z = baseGeoInfo.environmentBrdf.z / BRDF_Z_SCALE;
            vec3 tf_E_conductor = (vec3(1.0) - thinFilmConductorRaw) * vec3(tf_brdf_x) + thinFilmConductorRaw * vec3(tf_E_ss) - tf_b * vec3(tf_brdf_z);
            vec3 tf_F_avg_conductor = thinFilmConductorRaw + (vec3(1.0) - thinFilmConductorRaw) / 21.0 - tf_b / 126.0;
        #else
            vec3 tf_E_conductor = (vec3(1.0) - thinFilmConductorRaw) * vec3(tf_brdf_x) + thinFilmConductorRaw * vec3(tf_E_ss);
            vec3 tf_F_avg_conductor = thinFilmConductorRaw + (vec3(1.0) - thinFilmConductorRaw) / 21.0;
        #endif
        vec3 tf_ECF_conductor = vec3(1.0) + tf_F_avg_conductor * (vec3(1.0) / vec3(tf_E_ss) - vec3(1.0));
        vec3 thinFilmConductorFresnel = specular_weight * clamp(tf_E_conductor * tf_ECF_conductor, vec3(0.0), vec3(1.0));
        conductorIblFresnel = mix(conductorIblFresnel, thinFilmConductorFresnel, thin_film_weight * thin_film_ior_scale);
    #endif

    

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
    if (coat_weight > 0.0) {
        slab_coat_ibl = coatEnvironmentLight * vLightingIntensity.z;

        #ifdef AMBIENT_OCCLUSION
            coat_specular_ambient_occlusion = compute_specular_occlusion(coatGeoInfo.NdotV, 0.0, ambient_occlusion.x, coat_roughness);
        #endif
    }

    #if defined(FUZZ) &&defined(FUZZENVIRONMENTBRDF)
        vec3 slab_fuzz_ibl = fuzzEnvironmentLight * vLightingIntensity.z;
    #endif

    vec3 slab_translucent_base_ibl = vec3(0.0);
    vec3 slab_subsurface_ibl = vec3(0., 0., 0.);
    #ifdef REFRACTED_ENVIRONMENT
        
        // First, sample the refracted environment lighting. This is the pure forward-scattered light.
        // i.e. the light goes through the volume without changing direction due to scattering.
        #ifdef ANISOTROPIC_BASE
            vec3 forwardScatteredEnvironmentLight = sampleRadianceAnisotropic(transmission_roughness_alpha, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                , baseGeoInfo
                #ifdef GEOMETRY_THIN_WALLED
                , viewDirectionW
                #else
                , normalW
                #endif
                , viewDirectionW
                , vPositionW
                , noise
                , true // isRefraction
                #ifdef GEOMETRY_THIN_WALLED
                    , 1.05 // don't want much refraction for thin-walled but we need some to get an anisotropic effect
                #else
                    , specular_ior // Used for refraction
                #endif
                , reflectionSampler
                #ifdef REALTIME_FILTERING
                    , vReflectionFilteringInfo
                #endif
            );
        #else
            vec3 forwardScatteredEnvironmentLight = vec3(0., 0., 0.);
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
                forwardScatteredEnvironmentLight[i] = sampleRadiance(transmission_roughness_alpha, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                    , baseGeoInfo
                    , reflectionSampler
                    , iblRefractionCoords
                    #ifdef REALTIME_FILTERING
                        , vReflectionFilteringInfo
                    #endif
                )[i];
            #else
                forwardScatteredEnvironmentLight = sampleRadiance(transmission_roughness_alpha, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
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
        #endif
        #ifdef REFRACTED_BACKGROUND
            // Scale the IBL refraction so that we only see it at higher roughnesses
            // At low blurriness the transmitted light is mostly coming from the background geometry which is in front of the IBL.
            // At high blurriness, the refraction from the environment will be coming from more directions
            // and so we want to include more of this indirect lighting.
            #ifdef GEOMETRY_THIN_WALLED
                forwardScatteredEnvironmentLight = mix(slab_translucent_background.rgb, forwardScatteredEnvironmentLight.rgb, 0.2 * transmission_roughness_alpha);
            #else
                forwardScatteredEnvironmentLight = max(slab_translucent_background.rgb, mix(slab_translucent_background.rgb, forwardScatteredEnvironmentLight, transmission_roughness_alpha));
            #endif
        #endif

        #ifdef SCATTERING
            #ifdef GEOMETRY_THIN_WALLED
                vec3 scatterVector = normalW;
            #else
                // Handle isotropic and backscattering components
                // We'll approximate scattering as a diffuse lobe. If we have a dominant lighting direction,
                // we can bias the lobe towards that direction as the scatter density gets thinner.
                #if defined(USEIRRADIANCEMAP) && defined(USE_IRRADIANCE_DOMINANT_DIRECTION)
                    vec3 scatterVector = mix(vReflectionDominantDirection, normalW, max3(iso_scatter_density));
                #else
                    vec3 scatterVector = normalW;
                #endif

                // We'll then bend the sample direction towards the view direction based on the anisotropy to approximate backscattering.
                scatterVector = mix(viewDirectionW, scatterVector, back_to_iso_scattering_blend);
            #endif
            #if defined(USE_IRRADIANCE_TEXTURE_FOR_SCATTERING) && !defined(GEOMETRY_THIN_WALLED)
                vec3 scatteredEnvironmentLight = scattered_light_from_irradiance_texture;
            #else
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
                    #if defined(GEOMETRY_THIN_WALLED)
                        , base_diffuse_roughness
                        , subsurface_color.rgb
                    #else
                        , 1.0
                        , volumeParams.multi_scatter_color
                    #endif
                );
            #endif

            #ifdef GEOMETRY_THIN_WALLED
                // Direct Transmission (aka forward-scattered light from back side)
                vec3 forward_scattered_light = forwardScatteredEnvironmentLight * transmission_tint * volumeParams.multi_scatter_color;
                // Back Scattering
                vec3 back_scattered_light = scatteredEnvironmentLight * volumeParams.multi_scatter_color;
                // Lerp between the back and forward scattering.
                slab_translucent_base_ibl = mix(back_scattered_light, forward_scattered_light, 0.5 + 0.5 * volumeParams.anisotropy);
            #else
                // Direct Transmission (aka forward-scattered light from back side)
                vec3 forward_scattered_light = forwardScatteredEnvironmentLight * volume_absorption;
                // Back Scattering
                vec3 back_scattered_light = mix(forward_scattered_light, scatteredEnvironmentLight * backscatter_color, iso_scatter_density);
                // Iso Scattering
                vec3 iso_scattered_light = mix(forward_scattered_light, scatteredEnvironmentLight * volumeParams.multi_scatter_color, iso_scatter_density);

                // Lerp between the three based on the anisotropy
                slab_translucent_base_ibl = mix(back_scattered_light, iso_scattered_light, back_to_iso_scattering_blend);
                slab_translucent_base_ibl = mix(slab_translucent_base_ibl, forward_scattered_light, iso_to_forward_scattering_blend) * transmission_tint;
            #endif
        #else
            slab_translucent_base_ibl += forwardScatteredEnvironmentLight * transmission_tint * volume_absorption;
        #endif
    #endif
    
    // _____________________________ IBL Material Layer Composition ______________________________________
    #define CUSTOM_FRAGMENT_BEFORE_IBLLAYERCOMPOSITION

    slab_diffuse_ibl *= ambient_occlusion;
    slab_metal_ibl *= specular_ambient_occlusion;
    slab_glossy_ibl *= specular_ambient_occlusion;
    slab_coat_ibl *= coat_specular_ambient_occlusion;

    vec3 material_dielectric_base_ibl = mix(slab_diffuse_ibl * base_color.rgb, slab_translucent_base_ibl, surface_translucency_weight);
    vec3 material_dielectric_gloss_ibl = material_dielectric_base_ibl * (1.0 - dielectricIblFresnel) + slab_glossy_ibl * dielectricIblColoredFresnel;
    vec3 material_base_substrate_ibl = mix(material_dielectric_gloss_ibl, slab_metal_ibl, base_metalness);
    vec3 material_coated_base_ibl = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coatAbsorption, vec3(1.0));
    #if defined(FUZZ) && defined(FUZZENVIRONMENTBRDF)
        slab_fuzz_ibl *= min(vec3(specular_ambient_occlusion), ambient_occlusion);
        material_surface_ibl = layer(material_coated_base_ibl, slab_fuzz_ibl, fuzzIblFresnel * fuzz_weight, vec3(1.0), fuzz_color);
    #else
        material_surface_ibl = material_coated_base_ibl;
    #endif
#elif defined(REFRACTED_BACKGROUND)
    vec3 black = vec3(0.0);
    vec3 slab_translucent_base_ibl = vec3(0.0);
    #ifdef GEOMETRY_THIN_WALLED
        #ifdef SCATTERING
            // Direct Transmission (aka forward-scattered light from back side)
            vec3 forward_scattered_light = slab_translucent_background.rgb * transmission_tint * volumeParams.multi_scatter_color;
            // Lerp between the back and forward scattering.
            slab_translucent_base_ibl = mix(black, forward_scattered_light, 0.5 + 0.5 * volumeParams.anisotropy);
        #else
            slab_translucent_base_ibl = slab_translucent_background.rgb * transmission_tint;
        #endif
    #else
        #ifdef SCATTERING
            // Direct Transmission (aka forward-scattered light from back side)
            vec3 forward_scattered_light = slab_translucent_background.rgb * volume_absorption;
            // Iso Scattering
            vec3 iso_scattered_light = (1.0 - iso_scatter_density) * forward_scattered_light;

            // Lerp between the three based on the anisotropy
            slab_translucent_base_ibl = mix(black, iso_scattered_light, back_to_iso_scattering_blend);
            slab_translucent_base_ibl = mix(slab_translucent_base_ibl, forward_scattered_light, iso_to_forward_scattering_blend) * transmission_tint;
        #else
            slab_translucent_base_ibl = slab_translucent_background.rgb * volume_absorption * transmission_tint;
        #endif
    #endif
    
    vec3 material_dielectric_base_ibl = mix(black, slab_translucent_base_ibl.rgb, surface_translucency_weight);
    vec3 material_dielectric_gloss_ibl = material_dielectric_base_ibl * (baseGeoInfo.NdotV);
    vec3 material_base_substrate_ibl = mix(material_dielectric_gloss_ibl, black, base_metalness);
    vec3 material_coated_base_ibl = layer(material_base_substrate_ibl, black, coatIblFresnel, coatAbsorption, vec3(1.0));
    // #if defined(FUZZ) && defined(FUZZENVIRONMENTBRDF)
    //     slab_fuzz_ibl *= min(vec3(specular_ambient_occlusion), ambient_occlusion);
    //     material_surface_ibl = layer(material_coated_base_ibl, slab_fuzz_ibl, fuzzIblFresnel * fuzz_weight, vec3(1.0), fuzz_color);
    // #else
    //     material_surface_ibl = material_coated_base_ibl;
    // #endif
    material_surface_ibl = material_coated_base_ibl;
#endif