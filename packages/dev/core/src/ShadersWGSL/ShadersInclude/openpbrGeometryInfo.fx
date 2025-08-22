struct geometryInfoOutParams
{
    NdotV: f32,
    NdotVUnclamped: f32,
    environmentBrdf: vec3f,
    horizonOcclusion: f32,
    #ifdef ANISOTROPIC
        anisotropy: f32,
        anisotropicTangent: vec3f,
        anisotropicBitangent: vec3f,
    #endif
};

#define pbr_inline
fn geometryInfo(
    normalW: vec3f, viewDirectionW: vec3f, roughness: f32, geometricNormalW: vec3f
    #ifdef ANISOTROPIC
    , vAnisotropy: vec3f, TBN: mat3x3<f32>
    #endif
) -> geometryInfoOutParams
{
    var outParams: geometryInfoOutParams;
    outParams.NdotVUnclamped = dot(normalW, viewDirectionW);
    // The order 1886 page 3.
    outParams.NdotV = absEps(outParams.NdotVUnclamped);

    #if defined(ENVIRONMENTBRDF)
        // BRDF Lookup
        outParams.environmentBrdf = getBRDFLookup(outParams.NdotV, roughness);
    #else
        outParams.environmentBrdf = vec3f(0.0);
    #endif

    outParams.horizonOcclusion = 1.0f;
    #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        #ifdef HORIZONOCCLUSION
            #if defined(GEOMETRY_NORMAL) || defined(GEOMETRY_COAT_NORMAL)
                #ifdef REFLECTIONMAP_3D
                    outParams.horizonOcclusion = environmentHorizonOcclusion(-viewDirectionW, normalW, geometricNormalW);
                #endif
            #endif
        #endif
    #endif

    #ifdef ANISOTROPIC
        let anisotropy: f32 = vAnisotropy.b;
        let anisotropyDirection: vec3f = vec3f(vAnisotropy.xy, 0.0);
        let anisoTBN: mat3x3<f32> = mat3x3<f32>(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
        let anisotropicTangent: vec3f = normalize(anisoTBN * anisotropyDirection);
        let anisotropicBitangent: vec3f = normalize(cross(anisoTBN[2], anisotropicTangent));
        
        outParams.anisotropy = anisotropy;
        outParams.anisotropicTangent = anisotropicTangent;
        outParams.anisotropicBitangent = anisotropicBitangent;
        
    #endif

    return outParams;
}