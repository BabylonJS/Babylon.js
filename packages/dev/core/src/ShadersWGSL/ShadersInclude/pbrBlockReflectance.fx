#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
    // "Base" specular reflectance is the amount of light prevented from penetrating the diffuse surface by the specular lobe.
    // For dielectric materials, this is a greyscale value derived from the IOR and the maximum component of the specular colour.
    // For metallic materials, this is vec3(1.0). i.e. no light penetrates to the diffuse surface.
    var baseSpecularEnvironmentReflectance: vec3f = getReflectanceFromBRDFWithEnvLookup(vec3f(reflectanceF0), specularEnvironmentR90, environmentBrdf);
    
    // "Cumulative" specular reflectance is the base specular reflectance multiplied by the specular colour and other layers (e.g. iridescence, clearcoat).
    var cumulativeSpecularEnvironmentReflectance: vec3f = getReflectanceFromBRDFWithEnvLookup(clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, environmentBrdf);

    #ifdef RADIANCEOCCLUSION
        cumulativeSpecularEnvironmentReflectance *= seo;
    #endif

    #ifdef HORIZONOCCLUSION
        #ifdef BUMP
            #ifdef REFLECTIONMAP_3D
                cumulativeSpecularEnvironmentReflectance *= eho;
            #endif
        #endif
    #endif
#else
    // Jones implementation of a well balanced fast analytical solution.
    var cumulativeSpecularEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, clearcoatOut.specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));
    var baseSpecularEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, vec3f(reflectanceF0), specularEnvironmentR90, sqrt(microSurface));
#endif

#ifdef CLEARCOAT
    cumulativeSpecularEnvironmentReflectance *= clearcoatOut.conservationFactor;

    #if defined(CLEARCOAT_TINT)
        cumulativeSpecularEnvironmentReflectance *= clearcoatOut.absorption;
    #endif
#endif
