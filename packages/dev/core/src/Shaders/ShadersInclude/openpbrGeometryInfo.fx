struct geometryInfoOutParams
{
    float NdotV;
    float NdotVUnclamped;
    vec3 environmentBrdf;
    float horizonOcclusion;
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