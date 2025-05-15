#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
    // "Base" specular reflectance is the amount of light prevented from penetrating the diffuse surface by the specular lobe.
    // For dielectric materials, this is a greyscale value derived from the IOR and the maximum component of the specular colour.
    // For metallic materials, this is vec3(1.0). i.e. no light penetrates to the diffuse surface.
    var baseSpecularEnvironmentReflectance: vec3f = getReflectanceFromBRDFWithEnvLookup(vec3f(reflectanceF0), specularEnvironmentR90, environmentBrdf);
    
    // For OpenPBR, we use the F82 specular model for metallic materials. Because this is calculated separately,
    // we assume that reflectivityOut contains purely dielectric values and we mix the two here.
    // Otherwise, the reflectivityOut values are already a mix of dielectric and metallic values.
    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        // For OpenPBR, we use a different specular model for metallic materials. However, for simplicity, we're
        // passing in F0 and F90 values that are already a mix of dielectric and metallic values and then further mixing
        // the F82 lobe with the usual Schlick lobe based on the metallic value. For intermediate metallic values, I'm not
        // sure that the math is correct, but it seems to work well enough in practice.
        // The F90 value is used for the specular colour at F82 incidence. 
        var metalEnvironmentReflectance: vec3f = vec3f(reflectivityOut.specularWeight) * getF82Specular(NdotV, clearcoatOut.specularEnvironmentR0, reflectivityOut.colorReflectanceF90, reflectivityOut.roughness);
    #endif
    var dielectricEnvironmentReflectance = getReflectanceFromBRDFWithEnvLookup(clearcoatOut.specularEnvironmentR0, reflectivityOut.colorReflectanceF90, environmentBrdf);

    // "Color" specular reflectance is the base specular reflectance multiplied by the specular colour and other layers (e.g. iridescence, clearcoat).
    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        var colorSpecularEnvironmentReflectance: vec3f = mix(dielectricEnvironmentReflectance, metalEnvironmentReflectance, reflectivityOut.metallic);
    #else
        var colorSpecularEnvironmentReflectance: vec3f = dielectricEnvironmentReflectance;
    #endif

    #ifdef RADIANCEOCCLUSION
        colorSpecularEnvironmentReflectance *= seo;
    #endif

    #ifdef HORIZONOCCLUSION
        #ifdef BUMP
            #ifdef REFLECTIONMAP_3D
                colorSpecularEnvironmentReflectance *= eho;
            #endif
        #endif
    #endif
#else
    // Jones implementation of a well balanced fast analytical solution.
    var colorSpecularEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));
    var baseSpecularEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, vec3f(reflectanceF0), specularEnvironmentR90, sqrt(microSurface));
#endif

#ifdef CLEARCOAT
    colorSpecularEnvironmentReflectance *= clearcoatOut.conservationFactor;

    #if defined(CLEARCOAT_TINT)
        colorSpecularEnvironmentReflectance *= clearcoatOut.absorption;
    #endif
#endif
