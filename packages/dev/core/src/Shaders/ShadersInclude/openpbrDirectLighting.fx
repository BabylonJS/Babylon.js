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
            vec3 coloredFresnel;
            // For OpenPBR, we use the F82 specular model for metallic materials and mix with the
            // usual Schlick lobe.
            #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
                coloredFresnel = specular_weight * getF82Specular(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90, specular_roughness);
            #else
                coloredFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
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

    slab_diffuse *= base_color.rgb;
    vec3 material_opaque_base = mix(slab_diffuse, slab_subsurface, subsurface_weight);
    vec3 material_dielectric_base = mix(material_opaque_base, slab_translucent, transmission_weight);
    vec3 material_dielectric_gloss = layer(material_dielectric_base, slab_glossy, specularFresnel, vec3(1.0), specular_color);
    vec3 material_base_substrate = mix(material_dielectric_gloss, slab_metal, base_metalness);
    vec3 material_coated_base = layer(material_base_substrate, slab_coat, coatFresnel, coat_color, vec3(1.0));
    material_surface_direct += mix(material_coated_base, slab_fuzz, fuzz_weight);
}
#endif