
vec4 slab_translucent_background = vec4(0., 0., 0., 1.);

#ifdef REFRACTED_BACKGROUND
    {
    vec3 refractionUVW = vec3(backgroundRefractionMatrix * (view * vec4(vPositionW + refractedViewVector * geometry_thickness, 1.0)));
    vec2 refractionCoords = refractionUVW.xy / refractionUVW.z;
    refractionCoords.y = 1.0 - refractionCoords.y;
    
    // Select a mipmap LOD appropriate for the roughness (and IOR)
    // vBackgroundRefractionInfos.x is the number of mips of backgroundRefractionSampler
    float refractionLOD = transmission_roughness * vBackgroundRefractionInfos.x;
    // Apply a noise offset to reduce artifacts at higher LODs
    if (refractionLOD > 0.0) {
        refractionCoords += noise.xy / vec2(pow(2.0, vBackgroundRefractionInfos.x - refractionLOD));
    }
    slab_translucent_background = texture2DLodEXT(backgroundRefractionSampler, refractionCoords, refractionLOD);
    }

#endif