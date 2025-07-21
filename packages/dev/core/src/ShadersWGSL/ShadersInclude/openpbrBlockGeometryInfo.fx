var NdotVUnclamped: f32 = dot(normalW, viewDirectionW);
// The order 1886 page 3.
var NdotV: f32 = absEps(NdotVUnclamped);
var alphaG: f32 = convertRoughnessToAverageSlope(roughness);
var AARoughnessFactors: vec2f = getAARoughnessFactors(normalW.xyz);

#ifdef SPECULARAA
    // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
    alphaG += AARoughnessFactors.y;
#endif

#if defined(ENVIRONMENTBRDF)
    // BRDF Lookup
    var environmentBrdf: vec3f = getBRDFLookup(NdotV, roughness);
#endif

#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
    #ifdef RADIANCEOCCLUSION
        #ifdef AMBIENTINGRAYSCALE
            var ambientMonochrome: f32 = aoOut.ambientOcclusionColor.r;
        #else
            var ambientMonochrome: f32 = getLuminance(aoOut.ambientOcclusionColor);
        #endif

        var seo: f32 = environmentRadianceOcclusion(ambientMonochrome, NdotVUnclamped);
    #endif

    #ifdef HORIZONOCCLUSION
        #ifdef GEOMETRY_NORMAL
            #ifdef REFLECTIONMAP_3D
                var eho: f32 = environmentHorizonOcclusion(-viewDirectionW, normalW, geometricNormalW);
            #endif
        #endif
    #endif
#endif
