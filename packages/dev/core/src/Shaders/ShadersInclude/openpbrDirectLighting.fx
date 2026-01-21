#ifdef LIGHT{X}
{
    vec3 slab_diffuse = vec3(0., 0., 0.);
    vec3 slab_subsurface = vec3(0., 0., 0.);
    vec3 slab_translucent = slab_translucent_background.rgb;
    vec3 slab_glossy = vec3(0., 0., 0.);
    float specularFresnel = 0.0;
    vec3 specularColoredFresnel = vec3(0., 0., 0.);
    vec3 slab_metal = vec3(0., 0., 0.);
    vec3 slab_coat = vec3(0., 0., 0.);
    float coatFresnel = 0.0;
    vec3 slab_fuzz = vec3(0., 0., 0.);
    float fuzzFresnel = 0.0;

    // Diffuse Lobe
    #ifdef HEMILIGHT{X}
        slab_diffuse = computeHemisphericDiffuseLighting(preInfo{X}, lightColor{X}.rgb, light{X}.vLightGround);
    #elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        slab_diffuse = computeAreaDiffuseLighting(preInfo{X}, lightColor{X}.rgb);
    #else
        slab_diffuse = computeDiffuseLighting(preInfo{X}, lightColor{X}.rgb);
    #endif

    #ifdef PROJECTEDLIGHTTEXTURE{X}
        slab_diffuse *= computeProjectionTextureDiffuseLighting(projectionLightTexture{X}, textureProjectionMatrix{X}, vPositionW);
    #endif

    #ifdef FUZZ
        float fuzzNdotH = max(dot(fuzzNormalW, preInfo{X}.H), 0.0);
        vec3 fuzzBrdf = getFuzzBRDFLookup(fuzzNdotH, sqrt(fuzz_roughness));
    #endif

    #ifdef THIN_FILM
        float thin_film_desaturation_scale = (thin_film_ior - 1.0) * sqrt(thin_film_thickness * 0.001);
    #endif

    // Specular Lobe
    #if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        slab_glossy = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, baseConductorReflectance.F0, baseConductorReflectance.F90);
    #else
        {
            #ifdef ANISOTROPIC_BASE
                slab_glossy = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, 
                    baseGeoInfo.anisotropicTangent, baseGeoInfo.anisotropicBitangent, baseGeoInfo.anisotropy, 
                    0.0, lightColor{X}.rgb);
            #else
                // We're passing in vec3(1.0) for both F0 and F90 here because the actual Fresnel is computed below
                // Also computeSpecularLighting does some iridescence work using these values that we don't want.
                slab_glossy = computeSpecularLighting(preInfo{X}, normalW, vec3(1.0), vec3(1.0), specular_roughness, lightColor{X}.rgb);
            #endif
            specularFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseDielectricReflectance.F0, baseDielectricReflectance.F90);
            specularColoredFresnel = specularFresnel * specular_color;
            
            #ifdef THIN_FILM
                // Scale the thin film effect based on how different the IOR is from 1.0 (no thin film effect)
                vec3 thinFilmDielectricFresnel = evalIridescence(thin_film_outside_ior, thin_film_ior, preInfo{X}.VdotH, thin_film_thickness, baseDielectricReflectance.coloredF0);
                // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
                // closer to path-tracing reference.
                thinFilmDielectricFresnel = mix(thinFilmDielectricFresnel, vec3(dot(thinFilmDielectricFresnel, vec3(0.3333))), thin_film_desaturation_scale);
                specularColoredFresnel = mix(specularColoredFresnel, thinFilmDielectricFresnel * specular_color, thin_film_weight * thin_film_ior_scale);
            #endif
        }
    #endif

    // Refraction Lobe
    #ifdef REFRACTED_LIGHTS
        #if AREALIGHT{X}
            // TODO
        #else
            {
                preLightingInfo preInfoTrans = preInfo{X};
                #ifdef SCATTERING
                    preInfoTrans.roughness = sqrt(sqrt(max(refractionAlphaG, 0.05)));
                #else
                    preInfoTrans.roughness = transmission_roughness;
                #endif
                // On the side of the surface facing away from the light, we'll modify
                // the VdotH used for the Fresnel calculation. This is to avoid the maxed-out
                // Fresnel from obscuring the transmitted light.
                if (preInfoTrans.NdotLUnclamped <= 0.0) {
                    specularFresnel = 0.0;
                    specularColoredFresnel = specularFresnel * specular_color;
                }

                #ifdef ANISOTROPIC_BASE
                    preInfoTrans.NdotL = max(dot(-normalW, preInfoTrans.L), 0.0);
                #else
                    preInfoTrans.NdotL = max(dot(-normalW, preInfoTrans.L) * 0.5 + 0.5, 0.0);
                #endif

                #ifdef DISPERSION
                    // This is a hack to try to boost the separation of the dispersion effect.
                    // Especially with refraction, this effect is very subtle and we might question
                    // if it's needed for analytical lights at all...
                    float diff = min(dispersion_iors[2] - dispersion_iors[0], max(dispersion_iors[0] - 1.0, 1.0));
                    dispersion_iors[2] += diff;
                    dispersion_iors[0] -= diff;
                    for (int i = 0; i < 3; i++) {
                        float eta = 1.0 / dispersion_iors[i];
                #else
                    float eta = 1.0 / specular_ior;
                #endif
                    preInfoTrans.H = -normalize( preInfoTrans.L + min(eta, 0.95) * viewDirectionW);
                    preInfoTrans.VdotH = clamp(dot(viewDirectionW, preInfoTrans.H), 0.0, 1.0);
                
                #ifdef DISPERSION
                    slab_translucent[i] += 
                #else
                    slab_translucent += 
                #endif
                #ifdef ANISOTROPIC_BASE
                    computeAnisotropicSpecularLighting(preInfoTrans, viewDirectionW, normalW, 
                        baseGeoInfo.anisotropicTangent, baseGeoInfo.anisotropicBitangent, baseGeoInfo.anisotropy, 
                        roughness_alpha_modified_for_scatter, lightColor{X}.rgb
                #else
                    // We're passing in vec3(1.0) for both F0 and F90 here because the actual Fresnel is computed below
                    // Also computeSpecularLighting does some legacy iridescence work using these values that we don't want.
                    computeSpecularLighting(preInfoTrans, normalW, vec3(1.0), vec3(1.0), roughness_alpha_modified_for_scatter, lightColor{X}.rgb
                #endif
                #ifdef DISPERSION
                    )[i];
                }
                #else
                    );
                #endif

                // Empirical scattered light contribution for transmission
                // As roughness increases, we add a small ambient term to simulate scattering of internal reflections
                slab_translucent = mix(slab_translucent, 0.25 * preInfoTrans.attenuation * lightColor{X}.rgb, clamp(1.0 - pow(baseGeoInfo.NdotV, refractionAlphaG), 0.0, 1.0));

                #ifdef SCATTERING
                if (transmission_depth>0.0) {
                    // Compute forward-scattered light that has been completely diffused. This will be used when
                    // scattering is very strong.
                    preInfoTrans.roughness = 1.0;
                    vec3 diffused_forward_scattered_light = computeSpecularLighting(preInfoTrans, normalW, vec3(1.0), vec3(1.0), 1.0, lightColor{X}.rgb) * transmission_absorption;
                    
                    // Compute back-scattered light
                    preInfoTrans.NdotL = max(dot(viewDirectionW, preInfoTrans.L), 0.0);
                    preInfoTrans.NdotV = 1.0;
                    preInfoTrans.H = normalize(viewDirectionW + preInfoTrans.L);
                    preInfoTrans.VdotH = clamp(dot(viewDirectionW, preInfoTrans.H), 0.0, 1.0);
                    preInfoTrans.roughness = 0.3;
                    vec3 back_scattered_light = computeSpecularLighting(preInfoTrans, viewDirectionW, vec3(1.0), vec3(1.0), 0.025, lightColor{X}.rgb);
                    // Direct Transmission (aka forward-scattered light from back side)
                    // vec3 forward_scattered_light = mix(slab_translucent * transmission_absorption, additional_scattering, additional_scattering_scale);
                    vec3 forward_scattered_light = (slab_translucent * transmission_absorption);
                    
                    // Use the diffuse lobe as the isotropic scattered light component
                    vec3 iso_scattered_light = slab_diffuse;
                    // Back Scattering
                    vec3 back_scattering = mix(forward_scattered_light, forward_scattered_light + back_scattered_light * absorption_at_mfp, max3(iso_scatter_density));
                    // Iso Scattering
                    // vec3 iso_scattering = mix(forward_scattered_light, diffused_forward_scattered_light + iso_scattered_light * multi_scatter_color, max3(iso_scatter_density));
                    vec3 iso_scattering = mix(forward_scattered_light, (diffused_forward_scattered_light + iso_scattered_light) * mix(transmission_scatter.rgb, multi_scatter_color, max3(iso_scatter_density)), max3(iso_scatter_density));
                    // Lerp between the three based on the anisotropy
                    slab_translucent = mix(back_scattering, iso_scattering, back_to_iso_scattering_blend);
                    slab_translucent = mix(slab_translucent, forward_scattered_light, iso_to_forward_scattering_blend);
                }
                #else
                
                // Simple transmission without scattering
                slab_translucent *= transmission_absorption;
                
                #endif
            }
        #endif
    #endif

    // Metal Lobe
    #if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        slab_metal = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, baseConductorReflectance.F0, baseConductorReflectance.F90);
    #else
        {
            // For OpenPBR, we use the F82 specular model for metallic materials and mix with the
            // usual Schlick lobe.
            #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
                vec3 coloredFresnel = getF82Specular(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90, specular_roughness);
            #else
                vec3 coloredFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
            #endif

            #ifdef THIN_FILM
                vec3 thinFilmConductorFresnel = evalIridescence(thin_film_outside_ior, thin_film_ior, preInfo{X}.VdotH, thin_film_thickness, baseConductorReflectance.coloredF0);
                // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
                // closer to path-tracing reference.
                thinFilmConductorFresnel = mix(thinFilmConductorFresnel, vec3(dot(thinFilmConductorFresnel, vec3(0.3333))), thin_film_desaturation_scale);
                coloredFresnel = mix(coloredFresnel, specular_weight * thin_film_ior_scale * thinFilmConductorFresnel, thin_film_weight);
            #endif

            #ifdef ANISOTROPIC_BASE
                slab_metal = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, baseGeoInfo.anisotropicTangent, baseGeoInfo.anisotropicBitangent, baseGeoInfo.anisotropy, 0.0, lightColor{X}.rgb);
            #else
                slab_metal = computeSpecularLighting(preInfo{X}, normalW, vec3(1.0), coloredFresnel, specular_roughness, lightColor{X}.rgb);
            #endif

            
        }
    #endif

    // Coat Lobe
    #if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        slab_coat = computeAreaSpecularLighting(preInfoCoat{X}, light{X}.vLightSpecular.rgb, coatReflectance.F0, coatReflectance.F90);
    #else
        {
            #ifdef ANISOTROPIC_COAT
                slab_coat = computeAnisotropicSpecularLighting(preInfoCoat{X}, viewDirectionW, coatNormalW, 
                    coatGeoInfo.anisotropicTangent, coatGeoInfo.anisotropicBitangent, coatGeoInfo.anisotropy, 
                    0.0, lightColor{X}.rgb);
            #else
                slab_coat = computeSpecularLighting(preInfoCoat{X}, coatNormalW, vec3(coatReflectance.F0), vec3(1.0), coat_roughness, lightColor{X}.rgb);
            #endif

            float NdotH = max(dot(coatNormalW, preInfoCoat{X}.H), 0.0);
            coatFresnel = fresnelSchlickGGX(NdotH, coatReflectance.F0, coatReflectance.F90);
        }
    #endif

    vec3 coatAbsorption = vec3(1.0);
    if (coat_weight > 0.0) {
        // __________ Coat Darkening _____________
        float cosTheta_view = max(preInfoCoat{X}.NdotV, 0.001);
        float cosTheta_light = max(preInfoCoat{X}.NdotL, 0.001);
        
        // Fresnel reflectance for view direction
        float fresnel_view = coatReflectance.F0 + (1.0 - coatReflectance.F0) * pow(1.0 - cosTheta_view, 5.0);

        // Fresnel reflectance for light direction
        float fresnel_light = coatReflectance.F0 + (1.0 - coatReflectance.F0) * pow(1.0 - cosTheta_light, 5.0);

        // Average reflectance for the round trip (light in, view out)
        float averageReflectance = (fresnel_view + fresnel_light) * 0.5;

        // Calculate transmission through multiple internal reflections
        // This uses the geometric series for infinite reflections:
        // T = (1-R) / (1 + R + R² + R³ + ...) = (1-R) / (1/(1-R)) = (1-R)²
        float darkened_transmission = (1.0 - averageReflectance) / (1.0 + averageReflectance);
        darkened_transmission = mix(1.0, darkened_transmission, coat_darkening);

        // View-dependent coat absorption.
        // At normal incidence, coat absorption is simply the coat_color.
        // At grazing angles, there is increased darkening and saturation.
        float sin2 = 1.0 - cosTheta_view * cosTheta_view;
        // Divide by the square of the relative IOR (eta) of the incident medium and coat. This
        // is just coat_ior since the incident medium is air (IOR = 1.0).
        sin2 = sin2 / (coat_ior * coat_ior);
        float cos_t = sqrt(1.0 - sin2);
        float coatPathLength = 1.0 / cos_t;
        vec3 colored_transmission = pow(coat_color, vec3(coatPathLength));
        coatAbsorption = mix(vec3(1.0), colored_transmission * darkened_transmission, coat_weight);
    }

    #ifdef FUZZ
        fuzzFresnel = fuzzBrdf.z;
        vec3 fuzzNormalW = mix(normalW, coatNormalW, coat_weight);
        float fuzzNdotV = max(dot(fuzzNormalW, viewDirectionW.xyz), 0.0);
        float fuzzNdotL = max(dot(fuzzNormalW, preInfo{X}.L), 0.0);
        slab_fuzz = lightColor{X}.rgb * preInfo{X}.attenuation * evalFuzz(preInfo{X}.L, fuzzNdotL, fuzzNdotV, fuzzTangent, fuzzBitangent, fuzzBrdf);
    #else
        vec3 fuzz_color = vec3(0.0);
    #endif

    slab_diffuse *= base_color.rgb;
    vec3 material_opaque_base = mix(slab_diffuse, slab_subsurface, subsurface_weight);
    vec3 material_dielectric_base = mix(material_opaque_base, slab_translucent, transmission_weight);
    vec3 material_dielectric_gloss = material_dielectric_base * (1.0 - specularFresnel) + slab_glossy * specularColoredFresnel;
    vec3 material_base_substrate = mix(material_dielectric_gloss, slab_metal, base_metalness);
    vec3 material_coated_base = layer(material_base_substrate, slab_coat, coatFresnel, coatAbsorption, vec3(1.0));
    material_surface_direct += layer(material_coated_base, slab_fuzz, fuzzFresnel * fuzz_weight, vec3(1.0), fuzz_color);
}
#endif