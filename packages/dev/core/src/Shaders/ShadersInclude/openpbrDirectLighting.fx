#ifdef LIGHT{X}
{
    vec3 slab_diffuse = vec3(0., 0., 0.);
    vec3 slab_subsurface = vec3(0., 0., 0.);
    vec3 slab_translucent = vec3(0., 0., 0.);
    vec3 slab_glossy = vec3(0., 0., 0.);
    float specularFresnel = 0.0;
    vec3 slab_metal = vec3(0., 0., 0.);
    vec3 slab_coat = vec3(0., 0., 0.);
    float coatFresnel = 0.0;
    vec3 slab_fuzz = vec3(0., 0., 0.);

    // Diffuse Lobe
    #ifdef HEMILIGHT{X}
        slab_diffuse = computeHemisphericDiffuseLighting(preInfo{X}, lightColor{X}.rgb, light{X}.vLightGround);
    #elif defined(AREALIGHT{X})
        slab_diffuse = computeAreaDiffuseLighting(preInfo{X}, lightColor{X}.rgb);
    #else
        slab_diffuse = computeDiffuseLighting(preInfo{X}, lightColor{X}.rgb);
    #endif

    #ifdef PROJECTEDLIGHTTEXTURE{X}
        slab_diffuse *= computeProjectionTextureDiffuseLighting(projectionLightTexture{X}, textureProjectionMatrix{X}, vPositionW);
    #endif

    numLights += 1.0;

    // Specular Lobe
    #if AREALIGHT{X}
        slab_glossy = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, baseConductorReflectance.F0, baseConductorReflectance.F90);
    #else
        {
            #ifdef ANISOTROPIC
                slab_glossy = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, 
                    anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, 
                    vec3(baseDielectricReflectance.F0), vec3(baseDielectricReflectance.F90), baseGeoInfo.AARoughnessFactors.x, lightColor{X}.rgb);
            #else
                slab_glossy = computeSpecularLighting(preInfo{X}, normalW, baseDielectricReflectance.coloredF0, baseDielectricReflectance.coloredF90, specular_roughness, lightColor{X}.rgb);
            #endif
            
            float NdotH = dot(normalW, preInfo{X}.H);
            specularFresnel = fresnelSchlickGGX(NdotH, baseDielectricReflectance.F0, baseDielectricReflectance.F90);
        }
    #endif

    // Metal Lobe
    #if AREALIGHT{X}
        slab_metal = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, baseConductorReflectance.F0, baseConductorReflectance.F90);
    #else
        {
            // For OpenPBR, we use the F82 specular model for metallic materials and mix with the
            // usual Schlick lobe.
            #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
                vec3 coloredFresnel = specular_weight * getF82Specular(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90, specular_roughness);
            #else
                vec3 coloredFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
            #endif

            #ifdef ANISOTROPIC
                slab_metal = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, specularEnvironmentR0, specularEnvironmentR90, baseGeoInfo.AARoughnessFactors.x, lightColor{X}.rgb);
            #else
                slab_metal = computeSpecularLighting(preInfo{X}, normalW, vec3(baseConductorReflectance.coloredF0), coloredFresnel, specular_roughness, lightColor{X}.rgb);
            #endif
        }
    #endif

    // Coat Lobe
    #if AREALIGHT{X}
        slab_coat = computeAreaSpecularLighting(preInfoCoat{X}, light{X}.vLightSpecular.rgb, coatReflectance.F0, coatReflectance.F90);
    #else
        {
            #ifdef ANISOTROPIC
                slab_coat = computeAnisotropicSpecularLighting(preInfoCoat{X}, viewDirectionW, coatNormalW, 
                    anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, 
                    vec3(coatReflectance.F0), vec3(coatReflectance.F90), baseGeoInfo.AARoughnessFactors.x, lightColor{X}.rgb);
            #else
                slab_coat = computeSpecularLighting(preInfoCoat{X}, coatNormalW, vec3(coatReflectance.F0), vec3(1.0), coat_roughness, lightColor{X}.rgb);
            #endif

            float NdotH = dot(coatNormalW, preInfoCoat{X}.H);
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

    slab_diffuse *= base_color.rgb;
    vec3 material_opaque_base = mix(slab_diffuse, slab_subsurface, subsurface_weight);
    vec3 material_dielectric_base = mix(material_opaque_base, slab_translucent, transmission_weight);
    vec3 material_dielectric_gloss = layer(material_dielectric_base, slab_glossy, specularFresnel, vec3(1.0), specular_color);
    vec3 material_base_substrate = mix(material_dielectric_gloss, slab_metal, base_metalness);
    vec3 material_coated_base = layer(material_base_substrate, slab_coat, coatFresnel, coatAbsorption, vec3(1.0));
    material_surface_direct += mix(material_coated_base, slab_fuzz, fuzz_weight);
}
#endif