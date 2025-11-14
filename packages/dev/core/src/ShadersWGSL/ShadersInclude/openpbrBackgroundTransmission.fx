
var slab_translucent_background: vec4f = vec4f(0., 0., 0., 1.);

#ifdef REFRACTED_BACKGROUND
    {
    let refractionUVW: vec3f = vec3f((uniforms.backgroundRefractionMatrix * (scene.view * vec4f(fragmentInputs.vPositionW + refractedViewVector * geometry_thickness, 1.0f))).xyz);
    var refractionCoords: vec2f = refractionUVW.xy / refractionUVW.z;
    refractionCoords.y = 1.0f - refractionCoords.y;
    
    // Select a mipmap LOD appropriate for the roughness and IOR
    // vBackgroundRefractionInfos.x is the number of mips of backgroundRefractionSampler
    // When IOR is 1.0, there is no refraction, so LOD is 0
    let refractionLOD: f32 = specular_roughness * uniforms.vBackgroundRefractionInfos.x * 3.0f * (specular_ior - 1.0f);
    // Apply a noise offset to reduce artifacts at higher LODs
    if (refractionLOD > 0.0f) {
        refractionCoords += noise.xy / vec2f(pow(2.0f, uniforms.vBackgroundRefractionInfos.x - refractionLOD));
    }
    slab_translucent_background = textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords, refractionLOD);
    }

#endif