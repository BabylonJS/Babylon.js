struct reflectivityOutParams
{
    microSurface: f32,
    roughness: f32,
    diffuseRoughness: f32,
    surfaceReflectivityColor: vec3f,
    colorReflectanceF0: vec3f,
    reflectanceF0: f32,
    reflectanceF90: vec3f,
#ifdef METALLICWORKFLOW
    surfaceAlbedo: vec3f,
    metallic: f32,
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
    , baseDiffuseRoughness: f32
#ifdef BASE_DIFFUSE_ROUGHNESS
    , baseDiffuseRoughnessTexture: f32
    , baseDiffuseRoughnessInfos: vec2f
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
        outParams.metallic = metallicRoughness.r;
        #ifdef FROSTBITE_REFLECTANCE
            // *** NOT USED ANYMORE ***
            // Following Frostbite Remapping,
            // https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf page 115
            // var f0: vec3f = 0.16 * reflectance * reflectance * (1.0 - metallic) + baseColor * metallic;
            // where 0.16 * reflectance * reflectance remaps the reflectance to allow storage in 8 bit texture

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = baseColor.rgb * (1.0 - outParams.metallic);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(0.16 * reflectance * reflectance, baseColor, metallicRoughness.r);
        #else
            var metallicF0: vec3f = vec3f(reflectivityColor.a);

            #if DEBUGMODE > 0
                outParams.metallicF0 = metallicF0 * metallicReflectanceFactors.rgb;
            #endif

            // Compute the converted diffuse.
            outParams.surfaceAlbedo = baseColor.rgb;

            // Compute the converted reflectivity.
            surfaceReflectivityColor = metallicReflectanceFactors.rgb;
            
            // Final F0 for dielectrics = F0 * specular_color * specular_weight
            var dielectricColorF0: vec3f = vec3f(reflectivityColor.a * metallicReflectanceFactors.rgb * metallicReflectanceFactors.a);
            // Final F0 for metals = baseColor
            var metallicColorF0: vec3f = baseColor.rgb;
            
            // The coloured reflectance is the colour that is multiplied by the specular component but does NOT
            // actually represent the percentage of light reflected. 
            outParams.colorReflectanceF0 = mix(dielectricColorF0, metallicColorF0, outParams.metallic);

            // Reflectance is the non-coloured reflectance used for blending between the diffuse and specular components.
            // It represents the total percentage of light that is reflected at normal incidence.
            // In glTF's material model, this is the F0 value calculated from the IOR and then multiplied by the maximum component of the specular colour.
            outParams.reflectanceF0 = mix(reflectivityColor.a * metallicReflectanceFactors.a, 1.0, outParams.metallic);
            outParams.reflectanceF90 = vec3f(mix(metallicReflectanceFactors.a, 1.0, outParams.metallic));
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
        // The coloured reflectance is the colour that is multiplied by the specular component but does NOT
        // actually represent the percentage of light reflected. 
        outParams.colorReflectanceF0 = surfaceReflectivityColor;

        // Reflectance is the non-coloured reflectance used for blending between the diffuse and specular components.
        // It represents the total percentage of light that is reflected at normal incidence.
        // In glTF's material model, this is the F0 value calculated from the IOR and then multiplied by the maximum component of the specular colour.
        outParams.reflectanceF0 = max(surfaceReflectivityColor.r, max(surfaceReflectivityColor.g, surfaceReflectivityColor.b));
        outParams.reflectanceF90 = vec3f(1.0);
    #endif

	// Adapt microSurface.
    microSurface = saturate(microSurface);
    // Compute roughness.
    var roughness: f32 = 1. - microSurface;

    var diffuseRoughness: f32 = baseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
    diffuseRoughness *= baseDiffuseRoughnessTexture * baseDiffuseRoughnessInfos.y;
#endif

    outParams.microSurface = microSurface;
    outParams.roughness = roughness;
    outParams.diffuseRoughness = diffuseRoughness;
    outParams.surfaceReflectivityColor = surfaceReflectivityColor;

    return outParams;
}
