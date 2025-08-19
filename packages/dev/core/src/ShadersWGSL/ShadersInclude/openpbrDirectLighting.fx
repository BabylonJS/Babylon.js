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

    slab_diffuse *= base_color.rgb;
    let material_opaque_base: vec3f = mix(slab_diffuse, slab_subsurface, subsurface_weight);
    let material_dielectric_base: vec3f = mix(material_opaque_base, slab_translucent, transmission_weight);
    let material_dielectric_gloss: vec3f = layer(material_dielectric_base, slab_glossy, specularFresnel, vec3f(1.0), specular_color);
    let material_base_substrate: vec3f = mix(material_dielectric_gloss, slab_metal, base_metalness);
    let material_coated_base: vec3f = layer(material_base_substrate, slab_coat, coatFresnel, coatAbsorption, vec3f(1.0));
    material_surface_direct += mix(material_coated_base, slab_fuzz, fuzz_weight);
}
#endif