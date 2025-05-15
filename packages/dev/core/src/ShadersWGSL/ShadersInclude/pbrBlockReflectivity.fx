struct reflectivityOutParams
{
    microSurface: f32,
    roughness: f32,
    diffuseRoughness: f32,
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
        #ifdef REFLECTIVITY
            surfaceMetallicColorMap: vec4f,
        #endif
        metallicF0: vec3f,
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
        var ior: f32 = surfaceReflectivityColor.b;
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

        #define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS

        // Compute microsurface from roughness.
        microSurface = 1.0 - metallicRoughness.g;

        // Diffuse is used as the base of the reflectivity.
        var baseColor: vec3f = surfaceAlbedo;
        outParams.metallic = metallicRoughness.r;
        var specularWeight: f32 = metallicReflectanceFactors.a;
        var dielectricF0: f32 = reflectivityColor.a * specularWeight;
        surfaceReflectivityColor = metallicReflectanceFactors.rgb;
        
        #if DEBUGMODE > 0
            outParams.metallicF0 = dielectricF0 * surfaceReflectivityColor;
        #endif

        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            outParams.surfaceAlbedo = baseColor.rgb * (vec3f(1.0) - vec3f(dielectricF0) * surfaceReflectivityColor) * (1.0 - outParams.metallic);
        #else
            outParams.surfaceAlbedo = baseColor.rgb;
        #endif
        
        // Compute the coloured F0 reflectance.
        // The coloured reflectance is the percentage of light reflected by the specular lobe at normal incidence.
        // In glTF and OpenPBR, it is not the same thing as the percentage of light blocked from penetrating
        // down to the diffuse lobe. The non-coloured F0 will be used for this (see below).
        var dielectricColorF0: vec3f = vec3f(dielectricF0 * surfaceReflectivityColor);
        var metallicColorF0: vec3f = baseColor.rgb;
        outParams.colorReflectanceF0 = mix(dielectricColorF0, metallicColorF0, outParams.metallic);

        // Compute non-coloured reflectance.
        // reflectanceF0 is the non-coloured reflectance used for blending between the diffuse and specular components.
        // It represents the total percentage of light reflected by the specular lobe at normal incidence.
        // In glTF's material model, the F0 value is multiplied by the maximum component of the specular colour.
        dielectricF0 *= max(surfaceReflectivityColor.r, max(surfaceReflectivityColor.g, surfaceReflectivityColor.b));
        outParams.reflectanceF0 = mix(dielectricF0, 1.0, outParams.metallic);

        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            surfaceReflectivityColor = mix(surfaceReflectivityColor, baseColor.rgb, outParams.metallic);
            outParams.reflectanceF0 = max(surfaceReflectivityColor.r, max(surfaceReflectivityColor.g, surfaceReflectivityColor.b));
        #endif

        // Scale the reflectanceF90 by the IOR for values less than 1.5.
        // This is an empirical hack to account for the fact that Schlick is tuned for IOR = 1.5
        // and an IOR of 1.0 should result in no visible glancing specular.
        var f90Scale: f32 = clamp(2.0 * (ior - 1.0), 0.0, 1.0);
        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            outParams.reflectanceF90 = vec3f(specularWeight);
        #else
            outParams.reflectanceF90 = vec3f(mix(specularWeight * f90Scale, 1.0, outParams.metallic));
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

    return outParams;
}
