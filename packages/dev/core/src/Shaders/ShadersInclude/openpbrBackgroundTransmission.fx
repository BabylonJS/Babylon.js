
vec4 slab_translucent_background = vec4(0., 0., 0., 1.);

#if defined(REFRACTED_BACKGROUND) || defined(REFRACTED_ENVIRONMENT)
vec3 refractedViewVector = refract(-viewDirectionW, normalW, 1.0 / specular_ior);
#endif

#ifdef REFRACTED_BACKGROUND
    {
    vec3 refractionUVW = vec3(environmentRefractionMatrix * (view * vec4(vPositionW + refractedViewVector * geometry_thickness, 1.0)));
    vec2 refractionCoords = refractionUVW.xy / refractionUVW.z;
    refractionCoords.y = 1.0 - refractionCoords.y;
    
    // Select a mipmap LOD appropriate for the roughness and IOR
    // vEnvironmentRefractionInfos.x is the number of mips of environmentRefractionMap
    // When IOR is 1.0, there is no refraction, so LOD is 0
    float refractionLOD = specular_roughness * vEnvironmentRefractionInfos.x * 3.0 * (specular_ior - 1.0);
    // Apply a noise offset to reduce artifacts at higher LODs
    if (refractionLOD > 0.0) {
        refractionCoords += noise.xy / vec2(pow(2.0, vEnvironmentRefractionInfos.x - refractionLOD));
    }
    slab_translucent_background = texture2DLodEXT(environmentRefractionSampler, refractionCoords, refractionLOD);
    }

    // // TODO - move this somewhere later to handle for all transmitted light
    // {
    //     if (transmission_depth > 0.0) {
    //         // Beer's Law for absorption in transmissive materials
    //         vec3 invDepth = vec3(1. / maxEps(transmission_depth));
            
    //         vec3 absorption_coeff = -log(transmission_color.rgb) * invDepth;
    //         slab_translucent_background.rgb *= exp((-absorption_coeff.rgb * geometry_thickness));
    //     } else {
    //         slab_translucent_background.rgb *= transmission_color.rgb;
    //     }
    // }
#endif