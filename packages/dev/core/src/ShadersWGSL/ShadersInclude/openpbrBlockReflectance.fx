#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
    // "Base" specular reflectance is the amount of light prevented from penetrating the diffuse surface by the specular lobe.
    // For dielectric materials, this is a greyscale value derived from the IOR and the maximum component of the specular colour.
    // For metallic materials, this is vec3(1.0). i.e. no light penetrates to the diffuse surface.
    var baseSpecularEnvironmentReflectance: vec3f = getReflectanceFromBRDFWithEnvLookup(vec3f(reflectanceF0), vec3f(reflectivityOut.reflectanceF90), environmentBrdf);
    
    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        // For OpenPBR, we use a different specular lobe for metallic materials and then blend based on metalness. However,
        // to do this correctly, we really need reflectivityOut to contain separate F0 and F90 values for purely dielectric
        // and purely metal. Instead, the values are already a mix of dielectric and metallic values.
        // So, for intermediate metallic values, the result isn't 100% correct but it seems to work well enough in practice.
        // Because specular weight in OpenPBR removes the specular lobe entirely for metals, we do need the actual dielectric
        // F0 value to pickup the weight from the dielectric lobe.
        let metalEnvironmentReflectance: vec3f = vec3f(reflectivityOut.specularWeight) * getF82Specular(NdotV, reflectivityOut.colorReflectanceF0, reflectivityOut.colorReflectanceF90, reflectivityOut.roughness);
        let dielectricEnvironmentReflectance = getReflectanceFromBRDFWithEnvLookup(reflectivityOut.dielectricColorF0, reflectivityOut.colorReflectanceF90, environmentBrdf);
        var colorSpecularEnvironmentReflectance: vec3f = mix(dielectricEnvironmentReflectance, metalEnvironmentReflectance, reflectivityOut.metallic);
    #else
        var colorSpecularEnvironmentReflectance = getReflectanceFromBRDFWithEnvLookup(reflectivityOut.colorReflectanceF0, reflectivityOut.colorReflectanceF90, environmentBrdf);
    #endif

    #ifdef RADIANCEOCCLUSION
        colorSpecularEnvironmentReflectance *= seo;
    #endif

    #ifdef HORIZONOCCLUSION
        #ifdef GEOMETRY_NORMAL
            #ifdef REFLECTIONMAP_3D
                colorSpecularEnvironmentReflectance *= eho;
            #endif
        #endif
    #endif
#else
    // Jones implementation of a well balanced fast analytical solution.
    var colorSpecularEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, reflectivityOut.colorReflectanceF0, reflectivityOut.colorReflectanceF90, sqrt(microSurface));
    var baseSpecularEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, vec3f(reflectanceF0), vec3f(reflectivityOut.reflectanceF90), sqrt(microSurface));
#endif
