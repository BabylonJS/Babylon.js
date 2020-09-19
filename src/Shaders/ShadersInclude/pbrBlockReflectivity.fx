struct reflectivityOutParams
{
    float microSurface;
    float roughness;
    vec3 surfaceReflectivityColor;
#ifdef METALLICWORKFLOW
    vec3 surfaceAlbedo;
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    vec3 ambientOcclusionColor;
#endif
#if DEBUGMODE > 0
    vec4 surfaceMetallicColorMap;
    vec4 surfaceReflectivityColorMap;
    vec2 metallicRoughness;
    vec3 metallicF0;
#endif
};

#define pbr_inline
void reflectivityBlock(
    const in vec4 vReflectivityColor,
#ifdef METALLICWORKFLOW
    const in vec3 surfaceAlbedo,
    const in vec4 metallicReflectanceFactors,
#endif
#ifdef REFLECTIVITY
    const in vec3 reflectivityInfos,
    const in vec4 surfaceMetallicOrReflectivityColorMap,
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    const in vec3 ambientOcclusionColorIn,
#endif
#ifdef MICROSURFACEMAP
    const in vec4 microSurfaceTexel,
#endif
#ifdef DETAIL
    const in vec4 detailColor,
    const in vec4 vDetailInfos,
#endif
    out reflectivityOutParams outParams
)
{
    float microSurface = vReflectivityColor.a;
    vec3 surfaceReflectivityColor = vReflectivityColor.rgb;

    #ifdef METALLICWORKFLOW
        vec2 metallicRoughness = surfaceReflectivityColor.rg;

        #ifdef REFLECTIVITY
            #if DEBUGMODE > 0
                outParams.surfaceMetallicColorMap = surfaceMetallicOrReflectivityColorMap;
            #endif

            #ifdef AOSTOREINMETALMAPRED
                vec3 aoStoreInMetalMap = vec3(surfaceMetallicOrReflectivityColorMap.r, surfaceMetallicOrReflectivityColorMap.r, surfaceMetallicOrReflectivityColorMap.r);
                outParams.ambientOcclusionColor = mix(ambientOcclusionColorIn, aoStoreInMetalMap, vReflectivityInfos.z);
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
            vec3 metallicF0 = metallicReflectanceFactors.rgb;

            #if DEBUGMODE > 0
                outParams.metallicF0 = metallicF0;
            #endif

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = mix(baseColor.rgb * (1.0 - metallicF0), vec3(0., 0., 0.), metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(metallicF0, baseColor, metallicRoughness.r);
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

    outParams.microSurface = microSurface;
    outParams.roughness = roughness;
    outParams.surfaceReflectivityColor = surfaceReflectivityColor;
}
