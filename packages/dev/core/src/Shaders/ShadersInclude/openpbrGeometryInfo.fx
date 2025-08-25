struct geometryInfoOutParams
{
    float NdotV;
    float NdotVUnclamped;
    vec3 environmentBrdf;
    float horizonOcclusion;
    #ifdef ANISOTROPIC
        float anisotropy;
        vec3 anisotropicTangent;
        vec3 anisotropicBitangent;
    #endif
};

#define pbr_inline
geometryInfoOutParams geometryInfo(
    in vec3 normalW, in vec3 viewDirectionW, in float roughness, in vec3 geometricNormalW
    #ifdef ANISOTROPIC
    , in vec3 vAnisotropy, in mat3 TBN
    #endif
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

    #ifdef ANISOTROPIC
        float anisotropy = vAnisotropy.b;
        vec3 anisotropyDirection = vec3(vAnisotropy.xy, 0.);
        mat3 anisoTBN = mat3(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
        vec3 anisotropicTangent = normalize(anisoTBN * anisotropyDirection);
        vec3 anisotropicBitangent = normalize(cross(anisoTBN[2], anisotropicTangent));
        
        outParams.anisotropy = anisotropy;
        outParams.anisotropicTangent = anisotropicTangent;
        outParams.anisotropicBitangent = anisotropicBitangent;
        
    #endif

    return outParams;
}