struct geometryInfoOutParams
{
    float NdotV;
    float NdotVUnclamped;
    vec3 environmentBrdf;
    float horizonOcclusion;
};

struct geometryInfoAnisoOutParams
{
    float NdotV;
    float NdotVUnclamped;
    vec3 environmentBrdf;
    float horizonOcclusion;
    float anisotropy;
    vec3 anisotropicTangent;
    vec3 anisotropicBitangent;
    mat3 TBN;
};

#define pbr_inline
geometryInfoOutParams geometryInfo(
    in vec3 normalW, in vec3 viewDirectionW, in float roughness, in vec3 geometricNormalW
)
{
    geometryInfoOutParams outParams;
    outParams.NdotVUnclamped = dot(normalW, viewDirectionW);
    // The order 1886 page 3.
    outParams.NdotV = absEps(outParams.NdotVUnclamped);

    #if defined(ENVIRONMENTBRDF)
        // BRDF Lookup
        outParams.environmentBrdf = getBRDFLookup(outParams.NdotV, roughness);
    #else
        outParams.environmentBrdf = vec3(0.0);
    #endif

    outParams.horizonOcclusion = 1.0;
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

#define pbr_inline
geometryInfoAnisoOutParams geometryInfoAniso(
    in vec3 normalW, in vec3 viewDirectionW, in float roughness, in vec3 geometricNormalW
    , in vec3 vAnisotropy, in mat3 TBN
)
{
    geometryInfoOutParams geoInfo = geometryInfo(normalW, viewDirectionW, roughness, geometricNormalW);
    geometryInfoAnisoOutParams outParams;
    outParams.NdotV = geoInfo.NdotV;
    outParams.NdotVUnclamped = geoInfo.NdotVUnclamped;
    outParams.environmentBrdf = geoInfo.environmentBrdf;
    outParams.horizonOcclusion = geoInfo.horizonOcclusion;
    outParams.anisotropy = vAnisotropy.b;
    vec3 anisotropyDirection = vec3(vAnisotropy.xy, 0.);
    mat3 anisoTBN = mat3(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
    outParams.anisotropicTangent = normalize(anisoTBN * anisotropyDirection);
    outParams.anisotropicBitangent = normalize(cross(anisoTBN[2], outParams.anisotropicTangent));
    outParams.TBN = TBN;

    return outParams;
}