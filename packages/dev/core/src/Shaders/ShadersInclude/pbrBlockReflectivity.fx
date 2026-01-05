struct reflectivityOutParams
{
    float microSurface;
    float roughness;
    float diffuseRoughness;
    float reflectanceF0;
    vec3 reflectanceF90;
    vec3 colorReflectanceF0;
    vec3 colorReflectanceF90;
#ifdef METALLICWORKFLOW
    vec3 surfaceAlbedo;
    float metallic;
    float specularWeight;
    vec3 dielectricColorF0;
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    vec3 ambientOcclusionColor;
#endif
#if DEBUGMODE > 0
    #ifdef METALLICWORKFLOW
        #ifdef REFLECTIVITY
            vec4 surfaceMetallicColorMap;
        #endif
        vec3 metallicF0;
    #else
        #ifdef REFLECTIVITY
            vec4 surfaceReflectivityColorMap;
        #endif
    #endif
#endif
};

#define pbr_inline
reflectivityOutParams reflectivityBlock(
    in vec4 reflectivityColor
#ifdef METALLICWORKFLOW
    , in vec3 surfaceAlbedo
    , in vec4 metallicReflectanceFactors
#endif
    , in float baseDiffuseRoughness
#ifdef BASE_DIFFUSE_ROUGHNESS
    , in float baseDiffuseRoughnessTexture
    , in vec2 baseDiffuseRoughnessInfos
#endif
#ifdef REFLECTIVITY
    , in vec3 reflectivityInfos
    , in vec4 surfaceMetallicOrReflectivityColorMap
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    , in vec3 ambientOcclusionColorIn
#endif
#ifdef MICROSURFACEMAP
    , in vec4 microSurfaceTexel
#endif
#ifdef DETAIL
    , in vec4 detailColor
    , in vec4 vDetailInfos
#endif
)
{
    reflectivityOutParams outParams;
    float microSurface = reflectivityColor.a;
    vec3 surfaceReflectivityColor = reflectivityColor.rgb;

    #ifdef METALLICWORKFLOW
        vec2 metallicRoughness = surfaceReflectivityColor.rg;
        float ior = surfaceReflectivityColor.b;
        #ifdef REFLECTIVITY
            #if DEBUGMODE > 0
                outParams.surfaceMetallicColorMap = surfaceMetallicOrReflectivityColorMap;
            #endif

            #ifdef AOSTOREINMETALMAPRED
                vec3 aoStoreInMetalMap = vec3(surfaceMetallicOrReflectivityColorMap.r, surfaceMetallicOrReflectivityColorMap.r, surfaceMetallicOrReflectivityColorMap.r);
                outParams.ambientOcclusionColor = mix(ambientOcclusionColorIn, aoStoreInMetalMap, reflectivityInfos.z);
            #endif

            #ifdef METALLNESSSTOREINMETALMAPBLUE
                metallicRoughness.r *= surfaceMetallicOrReflectivityColorMap.b;
            #else
                metallicRoughness.r *= surfaceMetallicOrReflectivityColorMap.r;
            #endif

            #ifdef ROUGHNESSSTOREINMETALMAPALPHA
                metallicRoughness.g *= surfaceMetallicOrReflectivityColorMap.a;
            #else
                #ifdef ROUGHNESSSTOREINMETALMAPGREEN
                    metallicRoughness.g *= surfaceMetallicOrReflectivityColorMap.g;
                #endif
            #endif
        #endif

        #ifdef DETAIL
            float detailRoughness = mix(0.5, detailColor.b, vDetailInfos.w);
            float loLerp = mix(0., metallicRoughness.g, detailRoughness * 2.);
            float hiLerp = mix(metallicRoughness.g, 1., (detailRoughness - 0.5) * 2.);
            metallicRoughness.g = mix(loLerp, hiLerp, step(detailRoughness, 0.5));
        #endif

        #ifdef MICROSURFACEMAP
            metallicRoughness.g *= microSurfaceTexel.r;
        #endif

        #define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS

        // Compute microsurface from roughness.
        microSurface = 1.0 - metallicRoughness.g;

        // Diffuse is used as the base of the reflectivity.
        vec3 baseColor = surfaceAlbedo;
        outParams.metallic = metallicRoughness.r;
        outParams.specularWeight = metallicReflectanceFactors.a;
        float dielectricF0 = reflectivityColor.a * outParams.specularWeight;
        surfaceReflectivityColor = metallicReflectanceFactors.rgb;

        #if DEBUGMODE > 0
            outParams.metallicF0 = vec3(dielectricF0) * surfaceReflectivityColor;
        #endif

        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            outParams.surfaceAlbedo = baseColor.rgb * (vec3(1.0) - vec3(dielectricF0) * surfaceReflectivityColor) * (1.0 - outParams.metallic);
        #else
            outParams.surfaceAlbedo = baseColor.rgb;
        #endif
        
        // Compute non-coloured reflectance.
        // reflectanceF0 is the non-coloured reflectance used for blending between the diffuse and specular components.
        // It represents the total percentage of light reflected by the specular lobe at normal incidence.
        // In glTF's material model, the F0 value is multiplied by the maximum component of the specular colour.
        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            {
                vec3 reflectivityColor = mix(dielectricF0 * surfaceReflectivityColor, baseColor.rgb, outParams.metallic);
                outParams.reflectanceF0 = max(reflectivityColor.r, max(reflectivityColor.g, reflectivityColor.b));
            }
        #else
            #if DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_GLTF
                float maxF0 = max(surfaceReflectivityColor.r, max(surfaceReflectivityColor.g, surfaceReflectivityColor.b));
                outParams.reflectanceF0 = mix(dielectricF0 * maxF0, 1.0, outParams.metallic);
            #else
                outParams.reflectanceF0 = mix(dielectricF0, 1.0, outParams.metallic);
            #endif
        #endif

        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            outParams.reflectanceF90 = vec3(outParams.specularWeight);
            float f90Scale = 1.0;
        #else
            // Scale the reflectanceF90 by the IOR for values less than 1.5.
            // This is an empirical hack to account for the fact that Schlick is tuned for IOR = 1.5
            // and an IOR of 1.0 should result in no visible glancing specular.
            float f90Scale = clamp(2.0 * (ior - 1.0), 0.0, 1.0);
            outParams.reflectanceF90 = vec3(mix(outParams.specularWeight * f90Scale, 1.0, outParams.metallic));
        #endif

        // Compute the coloured F0 reflectance.
        // The coloured reflectance is the percentage of light reflected by the specular lobe at normal incidence.
        // In glTF and OpenPBR, it is not the same thing as the percentage of light blocked from penetrating
        // down to the diffuse lobe. The non-coloured F0 will be used for this (see below).
        outParams.dielectricColorF0 = vec3(dielectricF0 * surfaceReflectivityColor);
        vec3 metallicColorF0 = baseColor.rgb;
        outParams.colorReflectanceF0 = mix(outParams.dielectricColorF0, metallicColorF0, outParams.metallic);
        
        // Now, compute the coloured reflectance at glancing angles based on the specular model.
        #if (DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_OPENPBR)
            // In OpenPBR, the F90 is coloured using the specular colour for dielectrics.
            vec3 dielectricColorF90 = surfaceReflectivityColor * vec3(outParams.specularWeight) * vec3(f90Scale);
        #else
            // In glTF, the F90 is white for dielectrics.
            vec3 dielectricColorF90 = vec3(outParams.specularWeight * f90Scale);
        #endif
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
            // In OpenPBR, we use the "F82" model for conductors.
            // We'll use the F90 value to hold the F82 tint which will be used in the computation later.
            vec3 conductorColorF90 = surfaceReflectivityColor;
        #else
            // In glTF, the F90 colour for metals is white.
            #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
                vec3 conductorColorF90 = outParams.reflectanceF90;
            #else
                vec3 conductorColorF90 = vec3(1.0);
            #endif
        #endif
        outParams.colorReflectanceF90 = mix(dielectricColorF90, conductorColorF90, outParams.metallic);
    #else
        #ifdef REFLECTIVITY
            surfaceReflectivityColor *= surfaceMetallicOrReflectivityColorMap.rgb;

            #if DEBUGMODE > 0
                outParams.surfaceReflectivityColorMap = surfaceMetallicOrReflectivityColorMap;
            #endif

            #ifdef MICROSURFACEFROMREFLECTIVITYMAP
                microSurface *= surfaceMetallicOrReflectivityColorMap.a;
                microSurface *= reflectivityInfos.z;
            #else
                #ifdef MICROSURFACEAUTOMATIC
                    microSurface *= computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);
                #endif

                #ifdef MICROSURFACEMAP
                    microSurface *= microSurfaceTexel.r;
                #endif

                #define CUSTOM_FRAGMENT_UPDATE_MICROSURFACE

            #endif
        #endif
        // The coloured reflectance is the colour that is multiplied by the specular component but does NOT
        // actually represent the percentage of light reflected. 
        outParams.colorReflectanceF0 = surfaceReflectivityColor;

        // Reflectance is the non-coloured reflectance used for blending between the diffuse and specular components.
        // It represents the total percentage of light that is reflected at normal incidence.
        // In glTF's material model, this is the F0 value calculated from the IOR and then multiplied by the maximum component of the specular colour.
        outParams.reflectanceF0 = max(surfaceReflectivityColor.r, max(surfaceReflectivityColor.g, surfaceReflectivityColor.b));
        outParams.reflectanceF90 = vec3(1.0);
        #if (DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_OPENPBR)
            outParams.colorReflectanceF90 = surfaceReflectivityColor;
        #else
            outParams.colorReflectanceF90 = vec3(1.0);
        #endif
    #endif

	// Adapt microSurface.
    microSurface = saturate(microSurface);
    // Compute roughness.
    float roughness = 1. - microSurface;

    float diffuseRoughness = baseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
    diffuseRoughness *= baseDiffuseRoughnessTexture * baseDiffuseRoughnessInfos.y;
#endif

    outParams.microSurface = microSurface;
    outParams.roughness = roughness;
    outParams.diffuseRoughness = diffuseRoughness;

    return outParams;
}
