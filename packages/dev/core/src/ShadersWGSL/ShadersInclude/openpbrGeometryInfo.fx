struct geometryInfoOutParams
{
    NdotV: f32,
    NdotVUnclamped: f32,
    environmentBrdf: vec3f,
    horizonOcclusion: f32,
};

#define pbr_inline
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