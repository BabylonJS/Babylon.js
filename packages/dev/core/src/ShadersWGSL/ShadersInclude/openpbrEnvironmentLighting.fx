#if defined(REFLECTION) || defined(REFRACTED_BACKGROUND)

    // _____________________________ Coat Layer IBL _____________________________
    // We will use this absorption value to darken the underlying layers. It includes both the
    // abosorption of the coat layer and the darkening due to internal reflections.
    var coatAbsorption = vec3f(1.0f);

    // Coat IBL Fresnel
    var coatIblFresnel: f32 = 0.0;
    if (coat_weight > 0.0) {
        coatIblFresnel = computeDielectricIblFresnel(coatReflectance, coatGeoInfo.environmentBrdf);
    
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
        coatAbsorption = mix(vec3f(1.0f), colored_transmission * darkened_transmission, coat_weight);
    }
#endif
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
            , false // isRefraction
            , 1.0 // ior (not used for reflection)
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
                , false // isRefraction
                , 1.0 // ior (not used for reflection)
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
    var dielectricIblFresnel: f32 = computeDielectricIblFresnel(baseDielectricReflectance, baseGeoInfo.environmentBrdf);
    var dielectricIblColoredFresnel: vec3f = dielectricIblFresnel * specular_color;
    #ifdef THIN_FILM
        // For rough surfaces, the GGX microfacet distribution means VdotH never truly reaches 0
        // even at grazing NdotV. Using NdotV directly causes evalIridescence to return near-white
        // at glancing angles for any roughness, which is incorrect. Clamping to the GGX alpha
        // (specular_roughness^2) prevents this: smooth surfaces are unaffected (alpha≈0) while
        // rough surfaces retain colored interference fringes at glancing view angles.
        let thin_film_cos_theta: f32 = max(baseGeoInfo.NdotV, specularAlphaG);
        // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
        // closer to path-tracing reference.
        let thin_film_desaturation_scale = (thin_film_ior - 1.0) * sqrt(thin_film_thickness * 0.001f * thin_film_cos_theta);
        // Shared BRDF LUT values for thin film energy conservation.
        // brdf.x = integral of (F90-F0) Schlick factor; brdf.y = E_ss (white Fresnel integral).
        let tf_brdf_x: f32 = baseGeoInfo.environmentBrdf.x;
        let tf_E_ss: f32   = baseGeoInfo.environmentBrdf.y;

        // evalIridescence recovers IOR from baseDielectricReflectance.F0 internally.
        // F0 already bakes in specular_weight as mix(0, F0_ior, weight), so the
        // specular_weight → thin-film-strength relationship is preserved. The maxR1
        // guard inside evalIridescence suppresses spurious colour when film IOR matches
        // the substrate IOR (e.g. specular_ior == thin_film_ior at weight=1).
        // Normal-incidence F0 for energy-correct split-sum magnitude.
        var thinFilmDielectricF0: vec3f = evalIridescence(thin_film_outside_ior, thin_film_ior, 1.0, thin_film_thickness, vec3f(baseDielectricReflectance.F0));
        thinFilmDielectricF0 = mix(thinFilmDielectricF0, vec3(dot(thinFilmDielectricF0, vec3f(0.3333f))), thin_film_desaturation_scale);
        // Angle-dependent evaluation for NdotV-varying colour.
        var thinFilmDielectricDir: vec3f = evalIridescence(thin_film_outside_ior, thin_film_ior, thin_film_cos_theta, thin_film_thickness, vec3f(baseDielectricReflectance.F0));
        thinFilmDielectricDir = mix(thinFilmDielectricDir, vec3(dot(thinFilmDielectricDir, vec3f(0.3333f))), thin_film_desaturation_scale);
        // Rescale directional colour ratios to F0 magnitude — energy-correct while preserving colour variation.
        let tf_f0d_avg: f32  = dot(thinFilmDielectricF0,  vec3f(0.3333f));
        let tf_dird_avg: f32 = dot(thinFilmDielectricDir, vec3f(0.3333f));
        var thin_film_dielectric: vec3f = thinFilmDielectricDir * (tf_f0d_avg / max(tf_dird_avg, 1e-5));
        let tf_E_dielectric: vec3f = (vec3f(1.0) - thin_film_dielectric) * vec3f(tf_brdf_x) + thin_film_dielectric * vec3f(tf_E_ss);
        let tf_F_avg_dielectric: vec3f = thin_film_dielectric + (vec3f(1.0) - thin_film_dielectric) / 21.0;
        let tf_ECF_dielectric: vec3f = vec3f(1.0) + tf_F_avg_dielectric * (vec3f(1.0) / vec3f(tf_E_ss) - vec3f(1.0));
        thin_film_dielectric = clamp(tf_E_dielectric * tf_ECF_dielectric, vec3f(0.0), vec3f(1.0));
        dielectricIblColoredFresnel = mix(dielectricIblColoredFresnel, thin_film_dielectric * specular_color, thin_film_weight * thin_film_ior_scale);
        // Furnace-test fix: update scalar for diffuse suppression to max channel of colored Fresnel.
        dielectricIblFresnel = max(dielectricIblColoredFresnel.r, max(dielectricIblColoredFresnel.g, dielectricIblColoredFresnel.b));
    #endif

    // Conductor IBL Fresnel
    var conductorIblFresnel: vec3f = computeConductorIblFresnel(baseConductorReflectance, baseGeoInfo.environmentBrdf);
    #ifdef THIN_FILM
        // Conductor thin film — keep using coloredF0 (no scalar IOR available for metals).
        // Normal-incidence F0 for energy-correct split-sum magnitude.
        var thinFilmConductorF0: vec3f = evalIridescence(thin_film_outside_ior, thin_film_ior, 1.0, thin_film_thickness, baseConductorReflectance.coloredF0);
        thinFilmConductorF0 = mix(thinFilmConductorF0, vec3(dot(thinFilmConductorF0, vec3f(0.3333f))), thin_film_desaturation_scale);
        // Angle-dependent evaluation for NdotV-varying colour.
        var thinFilmConductorDir: vec3f = evalIridescence(thin_film_outside_ior, thin_film_ior, thin_film_cos_theta, thin_film_thickness, baseConductorReflectance.coloredF0);
        thinFilmConductorDir = mix(thinFilmConductorDir, vec3(dot(thinFilmConductorDir, vec3f(0.3333f))), thin_film_desaturation_scale);
        // Rescale directional colour ratios to F0 magnitude — energy-correct while preserving colour variation.
        let tf_f0c_avg: f32  = dot(thinFilmConductorF0,  vec3f(0.3333f));
        let tf_dirc_avg: f32 = dot(thinFilmConductorDir, vec3f(0.3333f));
        var thinFilmConductorRaw: vec3f = thinFilmConductorDir * (tf_f0c_avg / max(tf_dirc_avg, 1e-5));
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR) && defined(ENVIRONMENTBRDF)
            // computeConductorIblFresnel uses getF82DirectionalAlbedo which includes -b*brdf.z (the
            // F82 dip term). The plain Schlick split-sum has no such term, so when specular_color !=
            // white (b > 0), the thin film integral is higher than the conductor baseline — causing the
            // "stronger F90" seen in IBL. Apply the same b-correction to stay energy-consistent.
            let tf_b: vec3f = getF82B(baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
            let tf_brdf_z: f32 = baseGeoInfo.environmentBrdf.z / BRDF_Z_SCALE;
            let tf_E_conductor: vec3f = (vec3f(1.0) - thinFilmConductorRaw) * vec3f(tf_brdf_x) + thinFilmConductorRaw * vec3f(tf_E_ss) - tf_b * vec3f(tf_brdf_z);
            let tf_F_avg_conductor: vec3f = thinFilmConductorRaw + (vec3f(1.0) - thinFilmConductorRaw) / 21.0 - tf_b / 126.0;
        #else
            let tf_E_conductor: vec3f = (vec3f(1.0) - thinFilmConductorRaw) * vec3f(tf_brdf_x) + thinFilmConductorRaw * vec3f(tf_E_ss);
            let tf_F_avg_conductor: vec3f = thinFilmConductorRaw + (vec3f(1.0) - thinFilmConductorRaw) / 21.0;
        #endif
        let tf_ECF_conductor: vec3f = vec3f(1.0) + tf_F_avg_conductor * (vec3f(1.0) / vec3f(tf_E_ss) - vec3f(1.0));
        var thinFilmConductorFresnel: vec3f = specular_weight * clamp(tf_E_conductor * tf_ECF_conductor, vec3f(0.0), vec3f(1.0));
        conductorIblFresnel = mix(conductorIblFresnel, thinFilmConductorFresnel, thin_film_weight * thin_film_ior_scale);
    #endif

    var slab_diffuse_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_glossy_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_metal_ibl: vec3f = vec3f(0., 0., 0.);
    var slab_coat_ibl: vec3f = vec3f(0., 0., 0.);

    slab_diffuse_ibl = baseDiffuseEnvironmentLight * uniforms.vLightingIntensity.z;
    #ifdef AMBIENT_OCCLUSION
        specular_ambient_occlusion = compute_specular_occlusion(baseGeoInfo.NdotV, base_metalness, ambient_occlusion.x, specular_roughness);
    #endif

    // Add the specular environment light
    slab_glossy_ibl = baseSpecularEnvironmentLight * uniforms.vLightingIntensity.z;

    // _____________________________ Metal Layer IBL ____________________________
    slab_metal_ibl = baseSpecularEnvironmentLight * conductorIblFresnel * uniforms.vLightingIntensity.z;

    // _____________________________ Coat Layer IBL _____________________________
    if (coat_weight > 0.0) {
        slab_coat_ibl = coatEnvironmentLight * uniforms.vLightingIntensity.z;

        #ifdef AMBIENT_OCCLUSION
            coat_specular_ambient_occlusion = compute_specular_occlusion(coatGeoInfo.NdotV, 0.0, ambient_occlusion.x, coat_roughness);
        #endif
    }

    #ifdef FUZZ
        var slab_fuzz_ibl = fuzzEnvironmentLight * uniforms.vLightingIntensity.z;
    #endif

    var slab_translucent_base_ibl: vec3f = vec3f(0.0f, 0.0f, 0.0f);
    #ifdef REFRACTED_ENVIRONMENT
        
        #ifdef ANISOTROPIC_BASE
            var forwardScatteredEnvironmentLight: vec3f = sampleRadianceAnisotropic(transmission_roughness_alpha, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
                , baseGeoInfo
                #ifdef GEOMETRY_THIN_WALLED
                , viewDirectionW
                #else
                , normalW
                #endif
                , viewDirectionW
                , fragmentInputs.vPositionW
                , noise
                , true // isRefraction
                #ifdef GEOMETRY_THIN_WALLED
                    , 1.05f // don't want much refraction for thin-walled but we need some to get an anisotropic effect
                #else
                    , specular_ior // Used for refraction
                #endif
                , reflectionSampler
                , reflectionSamplerSampler
                #ifdef REALTIME_FILTERING
                    , uniforms.vReflectionFilteringInfo
                #endif
            );
        #else
            var forwardScatteredEnvironmentLight: vec3f = vec3f(0., 0., 0.);
            #ifdef DISPERSION
                for (var i: i32 = 0; i < 3; i++) {
                    var iblRefractionCoords: vec3f = refractedViewVectors[i];
            #else
                var iblRefractionCoords: vec3f = refractedViewVector;
            #endif
            #ifdef REFRACTED_ENVIRONMENT_OPPOSITEZ
                iblRefractionCoords.z *= -1.0f;
            #endif
            #ifdef REFRACTED_ENVIRONMENT_LOCAL_CUBE
                iblRefractionCoords = parallaxCorrectNormal(fragmentInputs.vPositionW, refractedViewVector, uniforms.refractionSize, uniforms.refractionPosition);
            #endif

            iblRefractionCoords = (uniforms.reflectionMatrix * vec4f(iblRefractionCoords, 0.0f)).xyz;
            #ifdef DISPERSION
                forwardScatteredEnvironmentLight[i] = sampleRadiance(transmission_roughness_alpha, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
                    , baseGeoInfo
                    , reflectionSampler
                    , reflectionSamplerSampler
                    , iblRefractionCoords
                    #ifdef REALTIME_FILTERING
                        , uniforms.vReflectionFilteringInfo
                    #endif
                )[i];
            #else
                forwardScatteredEnvironmentLight = sampleRadiance(transmission_roughness_alpha, uniforms.vReflectionMicrosurfaceInfos.rgb, uniforms.vReflectionInfos
                    , baseGeoInfo
                    , reflectionSampler
                    , reflectionSamplerSampler
                    , iblRefractionCoords
                    #ifdef REALTIME_FILTERING
                        , uniforms.vReflectionFilteringInfo
                    #endif
                );
            #endif
            #ifdef DISPERSION
                }
            #endif
        #endif
        #ifdef REFRACTED_BACKGROUND
            // Scale the refraction so that we only see it at higher roughnesses
            // This is because we're adding this to the refraction map which should take priority
            // at low blurriness since it represents the transmitted light that is in front of the IBL.
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
                var scatterVector: vec3f = normalW;
            #else
                // Handle isotropic and backscattering components
                // We'll approximate scattering as a diffuse lobe. If we have a dominant lighting direction,
                // we can bias the lobe towards that direction as the scatter density gets thinner.
                #if defined(USEIRRADIANCEMAP) && defined(USE_IRRADIANCE_DOMINANT_DIRECTION)
                    var scatterVector: vec3f = mix(uniforms.vReflectionDominantDirection, normalW, max3(iso_scatter_density));
                #else
                    var scatterVector: vec3f = normalW;
                #endif

                // We'll then bend the sample direction towards the view direction based on the anisotropy to approximate backscattering.
                scatterVector = mix(viewDirectionW, scatterVector, back_to_iso_scattering_blend);
            #endif
            #if defined(USE_IRRADIANCE_TEXTURE_FOR_SCATTERING) && !defined(GEOMETRY_THIN_WALLED)
                var scatteredEnvironmentLight: vec3f = scattered_light_from_irradiance_texture;
            #else
                var scatteredEnvironmentLight: vec3f = sampleIrradiance(
                scatterVector
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
                #if defined(GEOMETRY_THIN_WALLED)
                    , base_diffuse_roughness
                    , subsurface_color.rgb
                #else
                    , 1.0f
                    , volumeParams.multi_scatter_color
                #endif
                );
            #endif

            #ifdef GEOMETRY_THIN_WALLED
                // Direct Transmission (aka forward-scattered light from back side)
                let forward_scattered_light: vec3f = forwardScatteredEnvironmentLight * transmission_tint * volumeParams.multi_scatter_color;
                // Back Scattering
                let back_scattered_light: vec3f = scatteredEnvironmentLight * volumeParams.multi_scatter_color;
                // Lerp between the back and forward scattering.
                slab_translucent_base_ibl = mix(back_scattered_light, forward_scattered_light, 0.5f + 0.5f * volumeParams.anisotropy);
            #else
                // Direct Transmission (aka forward-scattered light from back side)
                let forward_scattered_light: vec3f = forwardScatteredEnvironmentLight * volume_absorption;
                // Back Scattering
                let back_scattered_light: vec3f = mix(forward_scattered_light, scatteredEnvironmentLight * backscatter_color, iso_scatter_density);
                // Iso Scattering
                let iso_scattered_light: vec3f = mix(forward_scattered_light, scatteredEnvironmentLight * volumeParams.multi_scatter_color, iso_scatter_density);

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

    let material_dielectric_base_ibl: vec3f = mix(slab_diffuse_ibl * base_color.rgb, slab_translucent_base_ibl, surface_translucency_weight);
    let material_dielectric_gloss_ibl: vec3f = material_dielectric_base_ibl * (1.0 - dielectricIblFresnel) + slab_glossy_ibl * dielectricIblColoredFresnel;
    let material_base_substrate_ibl: vec3f = mix(material_dielectric_gloss_ibl, slab_metal_ibl, base_metalness);
    let material_coated_base_ibl: vec3f = layer(material_base_substrate_ibl, slab_coat_ibl, coatIblFresnel, coatAbsorption, vec3f(1.0f));
    #ifdef FUZZ
        slab_fuzz_ibl *= min(vec3(specular_ambient_occlusion), ambient_occlusion);
        material_surface_ibl = layer(material_coated_base_ibl, slab_fuzz_ibl, fuzzIblFresnel * fuzz_weight, vec3f(1.0f), fuzz_color);
    #else
        material_surface_ibl = material_coated_base_ibl;
    #endif
#elif defined(REFRACTED_BACKGROUND)
    let black = vec3f(0.0f);
    var slab_translucent_base_ibl: vec3f = vec3f(0.0f);
    #ifdef GEOMETRY_THIN_WALLED
        #ifdef SCATTERING
            // Direct Transmission (aka forward-scattered light from back side)
            let forward_scattered_light: vec3f = slab_translucent_background.rgb * transmission_tint * volumeParams.multi_scatter_color;
            // Lerp between the back and forward scattering.
            slab_translucent_base_ibl = mix(black, forward_scattered_light, 0.5f + 0.5f * volumeParams.anisotropy);
        #else
            slab_translucent_base_ibl = slab_translucent_background.rgb * transmission_tint;
        #endif
    #else
        #ifdef SCATTERING
            // Direct Transmission (aka forward-scattered light from back side)
            let forward_scattered_light: vec3f = slab_translucent_background.rgb * volume_absorption;
            // Iso Scattering
            let iso_scattered_light: vec3f = (1.0f - iso_scatter_density) * forward_scattered_light;

            // Lerp between the three based on the anisotropy
            slab_translucent_base_ibl = mix(black, iso_scattered_light, back_to_iso_scattering_blend);
            slab_translucent_base_ibl = mix(slab_translucent_base_ibl, forward_scattered_light, iso_to_forward_scattering_blend) * transmission_tint;
        #else
            slab_translucent_base_ibl = slab_translucent_background.rgb * volume_absorption * transmission_tint;
        #endif
    #endif
    
    let material_dielectric_base_ibl: vec3f = mix(black, slab_translucent_base_ibl.rgb, surface_translucency_weight);
    let material_dielectric_gloss_ibl: vec3f = material_dielectric_base_ibl * (baseGeoInfo.NdotV);
    let material_base_substrate_ibl: vec3f = mix(material_dielectric_gloss_ibl, black, base_metalness);
    let material_coated_base_ibl: vec3f = layer(material_base_substrate_ibl, black, coatIblFresnel, coatAbsorption, vec3f(1.0f));
    // #if defined(FUZZ) && defined(FUZZENVIRONMENTBRDF)
    //     slab_fuzz_ibl *= min(vec3(specular_ambient_occlusion), ambient_occlusion);
    //     material_surface_ibl = layer(material_coated_base_ibl, slab_fuzz_ibl, fuzzIblFresnel * fuzz_weight, vec3f(1.0f), fuzz_color);
    // #else
    //     material_surface_ibl = material_coated_base_ibl;
    // #endif
    material_surface_ibl = material_coated_base_ibl;
#endif
