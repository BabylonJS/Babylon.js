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

void reflectivityBlock(
    const in vec4 vReflectivityColor,
    const in vec2 uvOffset,
#ifdef METALLICWORKFLOW
    const in vec3 surfaceAlbedo,
#endif
#ifdef REFLECTIVITY
    const in vec3 vReflectivityInfos,
    const in vec2 vReflectivityUV,
    const in sampler2D reflectivitySampler,
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    const in vec3 ambientOcclusionColor,
#endif
#ifdef MICROSURFACEMAP
    const in vec2 vMicroSurfaceSamplerUV_,
    const in vec2 vMicroSurfaceSamplerInfos,
    const in sampler2D microSurfaceSampler,
#endif
    out reflectivityOutParams outParams
)
{
    float microSurface = vReflectivityColor.a;
    vec3 surfaceReflectivityColor = vReflectivityColor.rgb;

    #ifdef METALLICWORKFLOW
        vec2 metallicRoughness = surfaceReflectivityColor.rg;

        #ifdef REFLECTIVITY
            vec4 surfaceMetallicColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);

            #if DEBUGMODE > 0
                outParams.surfaceMetallicColorMap = surfaceMetallicColorMap;
            #endif

            #ifdef AOSTOREINMETALMAPRED
                vec3 aoStoreInMetalMap = vec3(surfaceMetallicColorMap.r, surfaceMetallicColorMap.r, surfaceMetallicColorMap.r);
                outParams.ambientOcclusionColor = mix(ambientOcclusionColor, aoStoreInMetalMap, vReflectivityInfos.z);
            #endif

            #ifdef METALLNESSSTOREINMETALMAPBLUE
                metallicRoughness.r *= surfaceMetallicColorMap.b;
            #else
                metallicRoughness.r *= surfaceMetallicColorMap.r;
            #endif

            #ifdef ROUGHNESSSTOREINMETALMAPALPHA
                metallicRoughness.g *= surfaceMetallicColorMap.a;
            #else
                #ifdef ROUGHNESSSTOREINMETALMAPGREEN
                    metallicRoughness.g *= surfaceMetallicColorMap.g;
                #endif
            #endif
        #endif

        #ifdef MICROSURFACEMAP
            vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV_ + uvOffset) * vMicroSurfaceSamplerInfos.y;
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

        #ifdef REFLECTANCE
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
            vec3 metallicF0 = vec3(vReflectivityColor.a, vReflectivityColor.a, vReflectivityColor.a);
            #ifdef METALLICF0FACTORFROMMETALLICMAP
                #ifdef REFLECTIVITY
                    metallicF0 *= surfaceMetallicColorMap.a;
                #endif
            #endif

            #if DEBUGMODE > 0
                outParams.metallicF0 = metallicF0;
            #endif

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = mix(baseColor.rgb * (1.0 - metallicF0.r), vec3(0., 0., 0.), metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(metallicF0, baseColor, metallicRoughness.r);
        #endif
    #else
        #ifdef REFLECTIVITY
            vec4 surfaceReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);
            surfaceReflectivityColor *= toLinearSpace(surfaceReflectivityColorMap.rgb);
            surfaceReflectivityColor *= vReflectivityInfos.y;

            #if DEBUGMODE > 0
                outParams.surfaceReflectivityColorMap = surfaceReflectivityColorMap;
                vec2 metallicRoughness;
                vec3 metallicF0;
            #endif

            #ifdef MICROSURFACEFROMREFLECTIVITYMAP
                microSurface *= surfaceReflectivityColorMap.a;
                microSurface *= vReflectivityInfos.z;
            #else
                #ifdef MICROSURFACEAUTOMATIC
                    microSurface *= computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);
                #endif

                #ifdef MICROSURFACEMAP
                    vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV_ + uvOffset) * vMicroSurfaceSamplerInfos.y;
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
