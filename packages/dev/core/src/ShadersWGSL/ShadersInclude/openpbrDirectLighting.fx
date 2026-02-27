#ifdef LIGHT{X}
{
    var slab_diffuse: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_subsurface: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_translucent: vec3f = slab_translucent_background.rgb;
    var slab_glossy: vec3f = vec3f(0.f, 0.f, 0.f);
    var specularFresnel: f32 = 0.0f;
    var specularColoredFresnel: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_metal: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_coat: vec3f = vec3f(0.f, 0.f, 0.f);
    var coatFresnel: f32 = 0.0f;
    var slab_fuzz: vec3f = vec3f(0.f, 0.f, 0.f);
    var fuzzFresnel: f32 = 0.0f;

    // _____________________________ Geometry Information _____________________________

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
        let fuzzNdotH: f32 = max(dot(fuzzNormalW, preInfo{X}.H), 0.0f);
        let fuzzBrdf: vec3f = getFuzzBRDFLookup(fuzzNdotH, sqrt(fuzz_roughness));
    #endif

    #ifdef THIN_FILM
        let thin_film_desaturation_scale: f32 = (thin_film_ior - 1.0f) * sqrt(thin_film_thickness * 0.001f);
    #endif

    // Specular Lobe
    #if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        slab_glossy = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, baseConductorReflectance.F0, baseConductorReflectance.F90);
    #else
        {
            #ifdef ANISOTROPIC_BASE
                slab_glossy = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, 
                    baseGeoInfo.anisotropicTangent, baseGeoInfo.anisotropicBitangent, baseGeoInfo.anisotropy, 
                    0.0f, lightColor{X}.rgb);
            #else
                // We're passing in vec3(1.0) for both F0 and F90 here because the actual Fresnel is computed below
                // Also computeSpecularLighting does some iridescence work using these values that we don't want.
                slab_glossy = computeSpecularLighting(preInfo{X}, normalW, vec3(1.0), vec3(1.0), specular_roughness, lightColor{X}.rgb);
            #endif
            specularFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseDielectricReflectance.F0, baseDielectricReflectance.F90);
            specularColoredFresnel = specularFresnel * specular_color;
            
            #ifdef THIN_FILM
                var thinFilmDielectricFresnel: vec3f = evalIridescence(thin_film_outside_ior, thin_film_ior, preInfo{X}.VdotH, thin_film_thickness, baseDielectricReflectance.coloredF0);
                // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
                // closer to path-tracing reference.
                thinFilmDielectricFresnel = mix(thinFilmDielectricFresnel, vec3f(dot(thinFilmDielectricFresnel, vec3f(0.3333f))), thin_film_desaturation_scale);
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
                var preInfoTrans = preInfo{X};
                #ifdef SCATTERING
                    preInfoTrans.roughness = sqrt(sqrt(max(refractionAlphaG, 0.05f)));
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
                    var dispersion_iors_local: vec3f = dispersion_iors;
                    let diff: f32 = min(dispersion_iors_local[2] - dispersion_iors_local[0], max(dispersion_iors_local[0] - 1.0, 1.0));
                    dispersion_iors_local[2] += diff;
                    dispersion_iors_local[0] -= diff;
                    for (var i: i32 = 0; i < 3; i++) {
                        let eta: f32 = 1.0 / dispersion_iors_local[i];
                #else
                    let eta: f32 = 1.0 / specular_ior;
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
                slab_translucent = mix(slab_translucent, 0.25f * preInfoTrans.attenuation * lightColor{X}.rgb, clamp(1.0f - pow(baseGeoInfo.NdotV, refractionAlphaG), 0.0f, 1.0f));

                #ifdef SCATTERING
                if (transmission_depth>0.0f) {
                    // Compute forward-scattered light that has been completely diffused. This will be used when
                    // scattering is very strong.
                    preInfoTrans.roughness = 1.0f;
                    let diffused_forward_scattered_light: vec3f = computeSpecularLighting(preInfoTrans, normalW, vec3f(1.0f), vec3f(1.0f), 1.0f, lightColor{X}.rgb) * transmission_absorption;
                    
                    // Compute back-scattered light
                    preInfoTrans.NdotL = max(dot(viewDirectionW, preInfoTrans.L), 0.0f);
                    preInfoTrans.NdotV = 1.0f;
                    preInfoTrans.H = normalize(viewDirectionW + preInfoTrans.L);
                    preInfoTrans.VdotH = clamp(dot(viewDirectionW, preInfoTrans.H), 0.0f, 1.0f);
                    preInfoTrans.roughness = 0.3f;
                    let back_scattered_light: vec3f = computeSpecularLighting(preInfoTrans, viewDirectionW, vec3f(1.0f), vec3f(1.0f), 0.025f, lightColor{X}.rgb);
                    // Direct Transmission (aka forward-scattered light from back side)
                    // let forward_scattered_light: vec3f = mix(slab_translucent * transmission_absorption, additional_scattering, additional_scattering_scale);
                    let forward_scattered_light: vec3f = (slab_translucent * transmission_absorption);
                    
                    // Use the diffuse lobe as the isotropic scattered light component
                    let iso_scattered_light: vec3f = slab_diffuse;
                    // Back Scattering
                    let back_scattering: vec3f = mix(forward_scattered_light, forward_scattered_light + back_scattered_light * absorption_at_mfp, max3(iso_scatter_density));
                    // Iso Scattering
                    // let iso_scattering: vec3f = mix(forward_scattered_light, diffused_forward_scattered_light + iso_scattered_light * multi_scatter_color, max3(iso_scatter_density));
                    let iso_scattering: vec3f = mix(forward_scattered_light, (diffused_forward_scattered_light + iso_scattered_light) * mix(transmission_scatter.rgb, multi_scatter_color, max3(iso_scatter_density)), max3(iso_scatter_density));
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
                var coloredFresnel: vec3f = getF82Specular(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90, specular_roughness);
            #else
                var coloredFresnel: vec3f = fresnelSchlickGGX(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
            #endif

            #ifdef THIN_FILM
                var thinFilmConductorFresnel = evalIridescence(thin_film_outside_ior, thin_film_ior, preInfo{X}.VdotH, thin_film_thickness, baseConductorReflectance.coloredF0);
                // Desaturate the thin film fresnel based on thickness and angle - this brings the results much
                // closer to path-tracing reference.
                thinFilmConductorFresnel = mix(thinFilmConductorFresnel, vec3f(dot(thinFilmConductorFresnel, vec3f(0.3333f))), thin_film_desaturation_scale);
                coloredFresnel = mix(coloredFresnel, specular_weight * thin_film_ior_scale * thinFilmConductorFresnel, thin_film_weight);
            #endif

            #ifdef ANISOTROPIC_BASE
                slab_metal = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, baseGeoInfo.anisotropicTangent, baseGeoInfo.anisotropicBitangent, baseGeoInfo.anisotropy, 0.0, lightColor{X}.rgb);
            #else
                slab_metal = computeSpecularLighting(preInfo{X}, normalW, vec3f(baseConductorReflectance.coloredF0), coloredFresnel, specular_roughness, lightColor{X}.rgb);
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
                    coatGeoInfo.anisotropicTangent, coatGeoInfo.anisotropicBitangent, coatGeoInfo.anisotropy, 0.0,
                    lightColor{X}.rgb);
            #else
                slab_coat = computeSpecularLighting(preInfoCoat{X}, coatNormalW, vec3f(coatReflectance.F0), vec3f(1.0f), coat_roughness, lightColor{X}.rgb);
            #endif

            let NdotH: f32 = saturateEps(dot(coatNormalW, preInfoCoat{X}.H));
            coatFresnel = fresnelSchlickGGX(NdotH, coatReflectance.F0, coatReflectance.F90);
        }
    #endif

    var coatAbsorption = vec3f(1.0f);
    if (coat_weight > 0.0) {
        // __________ Coat Darkening _____________
        let cosTheta_view: f32 = max(preInfoCoat{X}.NdotV, 0.001f);
        let cosTheta_light: f32 = max(preInfoCoat{X}.NdotL, 0.001f);

        // Fresnel reflectance for view direction
        let fresnel_view: f32 = coatReflectance.F0 + (1.0f - coatReflectance.F0) * pow(1.0f - cosTheta_view, 5.0);

        // Fresnel reflectance for light direction
        let fresnel_light: f32 = coatReflectance.F0 + (1.0f - coatReflectance.F0) * pow(1.0f - cosTheta_light, 5.0);

        // Average reflectance for the round trip (light in, view out)
        let averageReflectance: f32 = (fresnel_view + fresnel_light) * 0.5;

        // Calculate transmission through multiple internal reflections
        // This uses the geometric series for infinite reflections:
        // T = (1-R) / (1 + R + R² + R³ + ...) = (1-R) / (1/(1-R)) = (1-R)²
        var darkened_transmission: f32 = (1.0f - averageReflectance) / (1.0f + averageReflectance);
        darkened_transmission = mix(1.0f, darkened_transmission, coat_darkening);

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
        fuzzFresnel = fuzzBrdf.z;
        let fuzzNormalW = mix(normalW, coatNormalW, coat_weight);
        let fuzzNdotV: f32 = max(dot(fuzzNormalW, viewDirectionW.xyz), 0.0f);
        let fuzzNdotL: f32 = max(dot(fuzzNormalW, preInfo{X}.L), 0.0);
        slab_fuzz = lightColor{X}.rgb * preInfo{X}.attenuation * evalFuzz(preInfo{X}.L, fuzzNdotL, fuzzNdotV, fuzzTangent, fuzzBitangent, fuzzBrdf);
    #else
        let fuzz_color = vec3f(0.0);
    #endif

    slab_diffuse *= base_color.rgb;
    let material_opaque_base: vec3f = mix(slab_diffuse, slab_subsurface, subsurface_weight);
    let material_dielectric_base: vec3f = mix(material_opaque_base, slab_translucent, transmission_weight);
    let material_dielectric_gloss: vec3f = material_dielectric_base * (1.0f - specularFresnel) + slab_glossy * specularColoredFresnel;
    let material_base_substrate: vec3f = mix(material_dielectric_gloss, slab_metal, base_metalness);
    let material_coated_base: vec3f = layer(material_base_substrate, slab_coat, coatFresnel, coatAbsorption, vec3f(1.0f));
    material_surface_direct += layer(material_coated_base, slab_fuzz, fuzzFresnel * fuzz_weight, vec3f(1.0f), fuzz_color);
}
#endif