struct geometryInfoOutParams
{
    NdotV: f32,
    NdotVUnclamped: f32,
    environmentBrdf: vec3f,
    horizonOcclusion: f32
};

struct geometryInfoAnisoOutParams
{
    NdotV: f32,
    NdotVUnclamped: f32,
    environmentBrdf: vec3f,
    horizonOcclusion: f32,
    anisotropy: f32,
    anisotropicTangent: vec3f,
    anisotropicBitangent: vec3f,
    TBN: mat3x3<f32>
};

fn geometryInfo(
    normalW: vec3f, viewDirectionW: vec3f, roughness: f32, geometricNormalW: vec3f
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

    return outParams;
}

fn geometryInfoAniso(
    normalW: vec3f, viewDirectionW: vec3f, roughness: f32, geometricNormalW: vec3f
    , vAnisotropy: vec3f, TBN: mat3x3<f32>
) -> geometryInfoAnisoOutParams
{
    let geoInfo: geometryInfoOutParams = geometryInfo(normalW, viewDirectionW, roughness, geometricNormalW);
    var outParams: geometryInfoAnisoOutParams;
    outParams.NdotV = geoInfo.NdotV;
    outParams.NdotVUnclamped = geoInfo.NdotVUnclamped;
    outParams.environmentBrdf = geoInfo.environmentBrdf;
    outParams.horizonOcclusion = geoInfo.horizonOcclusion;
    outParams.anisotropy = vAnisotropy.b;
    let anisotropyDirection: vec3f = vec3f(vAnisotropy.xy, 0.);
    let anisoTBN: mat3x3<f32> = mat3x3<f32>(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
    outParams.anisotropicTangent = normalize(anisoTBN * anisotropyDirection);
    outParams.anisotropicBitangent = normalize(cross(anisoTBN[2], outParams.anisotropicTangent));
    outParams.TBN = TBN;

    return outParams;
}
