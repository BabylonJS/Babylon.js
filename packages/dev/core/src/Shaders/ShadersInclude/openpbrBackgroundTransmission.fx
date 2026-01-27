
vec4 slab_translucent_background = vec4(0., 0., 0., 1.);

#ifdef REFRACTED_BACKGROUND
{
    // Select a mipmap LOD appropriate for the roughness (and IOR)
    // vBackgroundRefractionInfos.x is the number of mips of backgroundRefractionSampler
    float refractionLOD = transmission_roughness * vBackgroundRefractionInfos.x;
    vec2 refractionNoiseOffset = vec2(0.0);
    
    #ifdef DISPERSION
    for (int i = 0; i < 3; i++) {
        vec3 refractedViewVector = refractedViewVectors[i];
    #endif
        vec3 refractionUVW = vec3(backgroundRefractionMatrix * (view * vec4(vPositionW + refractedViewVector * geometry_thickness, 1.0)));
        vec2 refractionCoords = refractionUVW.xy / refractionUVW.z;
        refractionCoords.y = 1.0 - refractionCoords.y;
        // Apply a noise offset to reduce artifacts at higher LODs
        if (refractionLOD > 0.0) {
            refractionNoiseOffset = (noise.xy + refractedViewVector.xy) / vec2(pow(2.0, vBackgroundRefractionInfos.x - refractionLOD));
        }
        refractionCoords += refractionNoiseOffset;
    #ifdef DISPERSION
        slab_translucent_background[i] = texture2DLodEXT(backgroundRefractionSampler, refractionCoords, refractionLOD)[i];
    }
    #else
        slab_translucent_background = texture2DLodEXT(backgroundRefractionSampler, refractionCoords, refractionLOD);
    #endif
}

#endif