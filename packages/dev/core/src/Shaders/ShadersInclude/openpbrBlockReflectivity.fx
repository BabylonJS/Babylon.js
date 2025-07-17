struct reflectivityOutParams
{
    float roughness;
    float diffuseRoughness;
    float reflectanceF0;
    vec3 reflectanceF90;
    vec3 colorReflectanceF0;
    vec3 colorReflectanceF90;
    float metallic;
    float specularWeight;
    vec3 dielectricColorF0;
#if defined(METALLIC_ROUGHNESS)  && defined(AOSTOREINMETALMAPRED)
    vec3 ambientOcclusionColor;
#endif
#if DEBUGMODE > 0
    #ifdef METALLIC_ROUGHNESS
        vec4 surfaceMetallicColorMap;
    #endif
    vec3 metallicF0;
#endif
};

#define pbr_inline
reflectivityOutParams reflectivityBlock(
    in vec4 reflectanceInfo
    , in vec3 surfaceAlbedo
    , in vec4 specularColor
    , in float baseDiffuseRoughness
#ifdef BASE_DIFFUSE_ROUGHNESS
    , in float baseDiffuseRoughnessTexture
    , in vec2 baseDiffuseRoughnessInfos
#endif
#ifdef METALLIC_ROUGHNESS
    , in vec3 reflectivityInfos
    , in vec4 metallicRoughnessFromTexture
#endif
#if defined(METALLIC_ROUGHNESS)  && defined(AOSTOREINMETALMAPRED)
    , in vec3 ambientOcclusionColorIn
#endif
#ifdef DETAIL
    , in vec4 detailColor
    , in vec4 vDetailInfos
#endif
)
{
    reflectivityOutParams outParams;
    vec2 metallicRoughness = reflectanceInfo.rg;
    float ior = reflectanceInfo.b;
    #ifdef METALLIC_ROUGHNESS
        #if DEBUGMODE > 0
            outParams.surfaceMetallicColorMap = metallicRoughnessFromTexture;
        #endif

        #ifdef AOSTOREINMETALMAPRED
            vec3 aoStoreInMetalMap = vec3(metallicRoughnessFromTexture.r, metallicRoughnessFromTexture.r, metallicRoughnessFromTexture.r);
            outParams.ambientOcclusionColor = mix(ambientOcclusionColorIn, aoStoreInMetalMap, reflectivityInfos.z);
        #endif

        metallicRoughness.r *= metallicRoughnessFromTexture.b;
        metallicRoughness.g *= metallicRoughnessFromTexture.g;
    #endif

    #ifdef DETAIL
        float detailRoughness = mix(0.5, detailColor.b, vDetailInfos.w);
        float loLerp = mix(0., metallicRoughness.g, detailRoughness * 2.);
        float hiLerp = mix(metallicRoughness.g, 1., (detailRoughness - 0.5) * 2.);
        metallicRoughness.g = mix(loLerp, hiLerp, step(detailRoughness, 0.5));
    #endif

    #define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS

    outParams.metallic = metallicRoughness.r;
    outParams.roughness = metallicRoughness.g;
    outParams.specularWeight = specularColor.a;
    const float outsideIOR = 1.0;
    float dielectricF0 = pow((ior - outsideIOR) / (ior + outsideIOR), 2.0) * outParams.specularWeight;

    #if DEBUGMODE > 0
        outParams.metallicF0 = vec3(dielectricF0) * specularColor.rgb;
    #endif

    // Compute non-coloured reflectance.
    // reflectanceF0 is the non-coloured reflectance used for blending between the diffuse and specular components.
    // It represents the total percentage of light reflected by the specular lobe at normal incidence.
    // In glTF's material model, the F0 value is multiplied by the maximum component of the specular colour.

    #if DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_GLTF
        float maxF0 = max(specularColor.r, max(specularColor.g, specularColor.b));
        outParams.reflectanceF0 = mix(dielectricF0 * maxF0, 1.0, outParams.metallic);
    #else
        outParams.reflectanceF0 = mix(dielectricF0, 1.0, outParams.metallic);
    #endif


    // Scale the reflectanceF90 by the IOR for values less than 1.5.
    // This is an empirical hack to account for the fact that Schlick is tuned for IOR = 1.5
    // and an IOR of 1.0 should result in no visible glancing specular.
    float f90Scale = clamp(2.0 * (ior - 1.0), 0.0, 1.0);
    outParams.reflectanceF90 = vec3(mix(outParams.specularWeight * f90Scale, 1.0, outParams.metallic));

    // Compute the coloured F0 reflectance.
    // The coloured reflectance is the percentage of light reflected by the specular lobe at normal incidence.
    // In glTF and OpenPBR, it is not the same thing as the percentage of light blocked from penetrating
    // down to the diffuse lobe. The non-coloured F0 will be used for this (see below).
    outParams.dielectricColorF0 = vec3(dielectricF0 * specularColor.rgb);
    vec3 metallicColorF0 = surfaceAlbedo.rgb;
    outParams.colorReflectanceF0 = mix(outParams.dielectricColorF0, metallicColorF0, outParams.metallic);
    
    // Now, compute the coloured reflectance at glancing angles based on the specular model.
    #if (DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_OPENPBR)
        // In OpenPBR, the F90 is coloured using the specular colour for dielectrics.
        vec3 dielectricColorF90 = specularColor.rgb * vec3(outParams.specularWeight) * vec3(f90Scale);
    #else
        // In glTF, the F90 is white for dielectrics.
        vec3 dielectricColorF90 = vec3(outParams.specularWeight * f90Scale);
    #endif
    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        // In OpenPBR, we use the "F82" model for conductors.
        // We'll use the F90 value to hold the F82 tint which will be used in the computation later.
        vec3 conductorColorF90 = specularColor.rgb;
    #else
        // In glTF, the F90 colour for metals is white.
        vec3 conductorColorF90 = vec3(1.0);
    #endif
    outParams.colorReflectanceF90 = mix(dielectricColorF90, conductorColorF90, outParams.metallic);

	float diffuseRoughness = baseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
    diffuseRoughness *= baseDiffuseRoughnessTexture * baseDiffuseRoughnessInfos.y;
#endif

    outParams.diffuseRoughness = diffuseRoughness;

    return outParams;
}
