struct reflectivityOutParams
{
    float microSurface;
    float roughness;
    float diffuseRoughness;
    vec3 surfaceReflectivityColor;
#ifdef METALLICWORKFLOW
    vec3 surfaceAlbedo;
    vec3 reflectanceF0;
    vec3 reflectanceF90;
    float metallic;
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    vec3 ambientOcclusionColor;
#endif
#if DEBUGMODE > 0
    #ifdef METALLICWORKFLOW
        vec2 metallicRoughness;
        #ifdef REFLECTIVITY
            vec4 surfaceMetallicColorMap;
        #endif
        #ifndef FROSTBITE_REFLECTANCE
            vec3 metallicF0;
        #endif
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

        #if DEBUGMODE > 0
            outParams.metallicRoughness = metallicRoughness;
        #endif

        #define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS

        // Compute microsurface from roughness.
        microSurface = 1.0 - metallicRoughness.g;

        // Diffuse is used as the base of the reflectivity.
        vec3 baseColor = surfaceAlbedo;
        outParams.metallic = metallicRoughness.r;
        #ifdef FROSTBITE_REFLECTANCE
            // *** NOT USED ANYMORE ***
            // Following Frostbite Remapping,
            // https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf page 115
            // vec3 f0 = 0.16 * reflectance * reflectance * (1.0 - metallic) + baseColor * metallic;
            // where 0.16 * reflectance * reflectance remaps the reflectance to allow storage in 8 bit texture

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = baseColor.rgb * (1.0 - metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(0.16 * reflectance * reflectance, baseColor, metallicRoughness.r);
        #else
            #if DEBUGMODE > 0
                outParams.metallicF0 = vec3(reflectivityColor.a) * metallicReflectanceFactors.rgb;
            #endif

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = mix(baseColor.rgb, vec3(0.0), outParams.metallic);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = metallicReflectanceFactors.rgb;

            // Final F0 for dielectrics = F0 * specular_color * specular_weight
            vec3 dielectricColorF0 = vec3(reflectivityColor.a * metallicReflectanceFactors.rgb * metallicReflectanceFactors.a);
            vec3 metallicColorF0 = baseColor.rgb;
            outParams.reflectanceF0 = mix(dielectricColorF0, metallicColorF0, outParams.metallic);
            outParams.reflectanceF90 = vec3(mix(metallicReflectanceFactors.a, 1.0, outParams.metallic));
        #endif
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
    outParams.surfaceReflectivityColor = surfaceReflectivityColor;

    return outParams;
}
