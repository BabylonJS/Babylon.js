struct reflectivityOutParams
{
    microSurface: f32,
    roughness: f32,
    surfaceReflectivityColor: vec3f,
#ifdef METALLICWORKFLOW
    surfaceAlbedo: vec3f,
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    ambientOcclusionColor: vec3f,
#endif
#if DEBUGMODE > 0
    #ifdef METALLICWORKFLOW
        metallicRoughness: vec2f,
        #ifdef REFLECTIVITY
            surfaceMetallicColorMap: vec4f,
        #endif
        #ifndef FROSTBITE_REFLECTANCE
            metallicF0: vec3f,
        #endif
    #else
        #ifdef REFLECTIVITY
            surfaceReflectivityColorMap: vec4f,
        #endif
    #endif
#endif
};

#define pbr_inline
fn reflectivityBlock(
    reflectivityColor: vec4f
#ifdef METALLICWORKFLOW
    , surfaceAlbedo: vec3f
    , metallicReflectanceFactors: vec4f
#endif
#ifdef REFLECTIVITY
    , reflectivityInfos: vec3f
    , surfaceMetallicOrReflectivityColorMap: vec4f
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
    , ambientOcclusionColorIn: vec3f
#endif
#ifdef MICROSURFACEMAP
    , microSurfaceTexel: vec4f
#endif
#ifdef DETAIL
    , detailColor: vec4f
    , vDetailInfos: vec4f
#endif
) -> reflectivityOutParams
{
    var outParams: reflectivityOutParams;
    var microSurface: f32 = reflectivityColor.a;
    var surfaceReflectivityColor: vec3f = reflectivityColor.rgb;

    #ifdef METALLICWORKFLOW
        var metallicRoughness: vec2f = surfaceReflectivityColor.rg;

        #ifdef REFLECTIVITY
            #if DEBUGMODE > 0
                outParams.surfaceMetallicColorMap = surfaceMetallicOrReflectivityColorMap;
            #endif

            #ifdef AOSTOREINMETALMAPRED
                var aoStoreInMetalMap: vec3f =  vec3f(surfaceMetallicOrReflectivityColorMap.r, surfaceMetallicOrReflectivityColorMap.r, surfaceMetallicOrReflectivityColorMap.r);
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
            var detailRoughness: f32 = mix(0.5, detailColor.b, vDetailInfos.w);
            var loLerp: f32 = mix(0., metallicRoughness.g, detailRoughness * 2.);
            var hiLerp: f32 = mix(metallicRoughness.g, 1., (detailRoughness - 0.5) * 2.);
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
        var baseColor: vec3f = surfaceAlbedo;

        #ifdef FROSTBITE_REFLECTANCE
            // *** NOT USED ANYMORE ***
            // Following Frostbite Remapping,
            // https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf page 115
            // var f0: vec3f = 0.16 * reflectance * reflectance * (1.0 - metallic) + baseColor * metallic;
            // where 0.16 * reflectance * reflectance remaps the reflectance to allow storage in 8 bit texture

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = baseColor.rgb * (1.0 - metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(0.16 * reflectance * reflectance, baseColor, metallicRoughness.r);
        #else
            var metallicF0: vec3f = metallicReflectanceFactors.rgb;

            #if DEBUGMODE > 0
                outParams.metallicF0 = metallicF0;
            #endif

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = mix(baseColor.rgb * (1.0 - metallicF0),  vec3f(0., 0., 0.), metallicRoughness.r);

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
    var roughness: f32 = 1. - microSurface;

    outParams.microSurface = microSurface;
    outParams.roughness = roughness;
    outParams.surfaceReflectivityColor = surfaceReflectivityColor;

    return outParams;
}
