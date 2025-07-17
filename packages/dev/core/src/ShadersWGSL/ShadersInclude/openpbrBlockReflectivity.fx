struct reflectivityOutParams
{
    roughness: f32,
    diffuseRoughness: f32,
    reflectanceF0: f32,
    reflectanceF90: vec3f,
    colorReflectanceF0: vec3f,
    colorReflectanceF90: vec3f,
    metallic: f32,
    specularWeight: f32,
    dielectricColorF0: vec3f,
#if defined(METALLIC_ROUGHNESS)  && defined(AOSTOREINMETALMAPRED)
    ambientOcclusionColor: vec3f,
#endif
#if DEBUGMODE > 0
    #ifdef METALLIC_ROUGHNESS
        surfaceMetallicColorMap: vec4f,
    #endif
    metallicF0: vec3f,
#endif
};

#define pbr_inline
fn reflectivityBlock(
    reflectanceInfo: vec4f
    , surfaceAlbedo: vec3f
    , specularColor: vec4f
    , baseDiffuseRoughness: f32
#ifdef BASE_DIFFUSE_ROUGHNESS
    , baseDiffuseRoughnessTexture: f32
    , baseDiffuseRoughnessInfos: vec2f
#endif
#ifdef METALLIC_ROUGHNESS
    , reflectivityInfos: vec3f
    , metallicRoughnessFromTexture: vec4f
#endif
#if defined(METALLIC_ROUGHNESS)  && defined(AOSTOREINMETALMAPRED)
    , ambientOcclusionColorIn: vec3f
#endif
#ifdef DETAIL
    , detailColor: vec4f
    , vDetailInfos: vec4f
#endif
) -> reflectivityOutParams
{
    var outParams: reflectivityOutParams;
    var metallicRoughness: vec2f = reflectanceInfo.rg;
    var ior: f32 = reflectanceInfo.b;
    #ifdef METALLIC_ROUGHNESS
        #if DEBUGMODE > 0
            outParams.surfaceMetallicColorMap = metallicRoughnessFromTexture;
        #endif

        #ifdef AOSTOREINMETALMAPRED
            var aoStoreInMetalMap: vec3f =  vec3f(metallicRoughnessFromTexture.r, metallicRoughnessFromTexture.r, metallicRoughnessFromTexture.r);
            outParams.ambientOcclusionColor = mix(ambientOcclusionColorIn, aoStoreInMetalMap, reflectivityInfos.z);
        #endif

        metallicRoughness.r *= metallicRoughnessFromTexture.b;
        metallicRoughness.g *= metallicRoughnessFromTexture.g;
    #endif

    #ifdef DETAIL
        var detailRoughness: f32 = mix(0.5, detailColor.b, vDetailInfos.w);
        var loLerp: f32 = mix(0., metallicRoughness.g, detailRoughness * 2.);
        var hiLerp: f32 = mix(metallicRoughness.g, 1., (detailRoughness - 0.5) * 2.);
        metallicRoughness.g = mix(loLerp, hiLerp, step(detailRoughness, 0.5));
    #endif

    #define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS

    outParams.metallic = metallicRoughness.r;
    outParams.roughness = metallicRoughness.g;
    outParams.specularWeight = specularColor.a;
    const outsideIOR: f32 = 1.0;
    let dielectricF0: f32 = pow((ior - outsideIOR) / (ior + outsideIOR), 2.0) * outParams.specularWeight;

    #if DEBUGMODE > 0
        outParams.metallicF0 = dielectricF0 * specularColor.rgb;
    #endif

    // Compute non-coloured reflectance.
    // reflectanceF0 is the non-coloured reflectance used for blending between the diffuse and specular components.
    // It represents the total percentage of light reflected by the specular lobe at normal incidence.
    // In glTF's material model, the F0 value is multiplied by the maximum component of the specular colour.
    #if DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_GLTF
        let maxF0: f32 = max(specularColor.r, max(specularColor.g, specularColor.b));
        outParams.reflectanceF0 = mix(dielectricF0 * maxF0, 1.0f, outParams.metallic);
    #else
        outParams.reflectanceF0 = mix(dielectricF0, 1.0, outParams.metallic);
    #endif

    // Scale the reflectanceF90 by the IOR for values less than 1.5.
    // This is an empirical hack to account for the fact that Schlick is tuned for IOR = 1.5
    // and an IOR of 1.0 should result in no visible glancing specular.
    var f90Scale: f32 = clamp(2.0 * (ior - 1.0), 0.0, 1.0);
    outParams.reflectanceF90 = vec3(mix(
    outParams.specularWeight * f90Scale, 1.0, outParams.metallic));

    // Compute the coloured F0 reflectance.
    // The coloured reflectance is the percentage of light reflected by the specular lobe at normal incidence.
    // In glTF and OpenPBR, it is not the same thing as the percentage of light blocked from penetrating
    // down to the diffuse lobe. The non-coloured F0 will be used for this (see below).
    outParams.dielectricColorF0 = vec3f(dielectricF0 * specularColor.rgb);
    var metallicColorF0: vec3f = surfaceAlbedo.rgb;
    outParams.colorReflectanceF0 = mix(outParams.dielectricColorF0, metallicColorF0, outParams.metallic);

    // Now, compute the coloured reflectance at glancing angles based on the specular model.
    #if (DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_OPENPBR)
        // In OpenPBR, the F90 is coloured using the specular colour for dielectrics.
        let dielectricColorF90
            : vec3f = specularColor.rgb *
                        vec3f(outParams.specularWeight * f90Scale);
    #else
        // In glTF, the F90 is white for dielectrics.
        let dielectricColorF90
            : vec3f = vec3f(outParams.specularWeight * f90Scale);
    #endif
    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        // In OpenPBR, we use the "F82" model for conductors.
        // We'll use the F90 value to hold the F82 tint which will be used in the computation later.
        let conductorColorF90: vec3f = specularColor.rgb;
    #else
        // In glTF, the F90 colour for metals is white.
        let conductorColorF90: vec3f = vec3f(1.0f);
    #endif
    outParams.colorReflectanceF90 = mix(dielectricColorF90, conductorColorF90, outParams.metallic);

	var diffuseRoughness: f32 = baseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
    diffuseRoughness *= baseDiffuseRoughnessTexture * baseDiffuseRoughnessInfos.y;
#endif

    outParams.diffuseRoughness = diffuseRoughness;

    return outParams;
}
