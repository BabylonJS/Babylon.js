#ifdef LIGHT{X}
{
    var slab_diffuse: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_subsurface: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_translucent: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_glossy: vec3f = vec3f(0.f, 0.f, 0.f);
    var specularFresnel: f32 = 0.0f;
    var slab_metal: vec3f = vec3f(0.f, 0.f, 0.f);
    var slab_coat: vec3f = vec3f(0.f, 0.f, 0.f);
    var coatFresnel: f32 = 0.0f;
    var slab_fuzz: vec3f = vec3f(0.f, 0.f, 0.f);

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

    numLights += 1.0f;

    // Specular Lobe
    #if AREALIGHT{X}
        slab_glossy = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, baseConductorReflectance.F0, baseConductorReflectance.F90);
    #else
        {
            #ifdef ANISOTROPIC
                slab_glossy = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, 
                    anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, 
                    vec3f(baseDielectricReflectance.F0), vec3f(baseDielectricReflectance.F90), baseGeoInfo.AARoughnessFactors.x, lightColor{X}.rgb);
            #else
                slab_glossy = computeSpecularLighting(preInfo{X}, normalW, baseDielectricReflectance.coloredF0, baseDielectricReflectance.coloredF90, specular_roughness, lightColor{X}.rgb);
            #endif
            
            let NdotH: f32 = dot(normalW, preInfo{X}.H);
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
                let coloredFresnel: vec3f = specular_weight * getF82Specular(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90, specular_roughness);
            #else
                let coloredFresnel: vec3f = fresnelSchlickGGX(preInfo{X}.VdotH, baseConductorReflectance.coloredF0, baseConductorReflectance.coloredF90);
            #endif

            #ifdef ANISOTROPIC
                slab_metal = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, specularEnvironmentR0, specularEnvironmentR90, baseGeoInfo.AARoughnessFactors.x, lightColor{X}.rgb);
            #else
                slab_metal = computeSpecularLighting(preInfo{X}, normalW, vec3f(baseConductorReflectance.coloredF0), coloredFresnel, specular_roughness, lightColor{X}.rgb);
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
                    vec3f(coatReflectance.F0), vec3f(coatReflectance.F90), baseGeoInfo.AARoughnessFactors.x, lightColor{X}.rgb);
            #else
                slab_coat = computeSpecularLighting(preInfoCoat{X}, coatNormalW, vec3f(coatReflectance.F0), vec3f(1.0f), coat_roughness, lightColor{X}.rgb);
            #endif

            let NdotH: f32 = dot(coatNormalW, preInfoCoat{X}.H);
            coatFresnel = fresnelSchlickGGX(NdotH, coatReflectance.F0, coatReflectance.F90);
        }
    #endif

    slab_diffuse *= base_color.rgb;
    let material_opaque_base: vec3f = mix(slab_diffuse, slab_subsurface, subsurface_weight);
    let material_dielectric_base: vec3f = mix(material_opaque_base, slab_translucent, transmission_weight);
    let material_dielectric_gloss: vec3f = layer(material_dielectric_base, slab_glossy, specularFresnel, vec3f(1.0), specular_color);
    let material_base_substrate: vec3f = mix(material_dielectric_gloss, slab_metal, base_metalness);
    let material_coated_base: vec3f = layer(material_base_substrate, slab_coat, coatFresnel, coat_color, vec3f(1.0));
    material_surface_direct += mix(material_coated_base, slab_fuzz, fuzz_weight);
}
#endif