float NdotVUnclamped = dot(normalW, viewDirectionW);
// The order 1886 page 3.
float NdotV = absEps(NdotVUnclamped);
float alphaG = convertRoughnessToAverageSlope(roughness);
vec2 AARoughnessFactors = getAARoughnessFactors(normalW.xyz);

#ifdef SPECULARAA
    // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
    alphaG += AARoughnessFactors.y;
#endif

#if defined(ENVIRONMENTBRDF)
    // BRDF Lookup
    vec3 environmentBrdf = getBRDFLookup(NdotV, roughness);
#endif

#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
    #ifdef RADIANCEOCCLUSION
        #ifdef AMBIENTINGRAYSCALE
            float ambientMonochrome = aoOut.ambientOcclusionColor.r;
        #else
            float ambientMonochrome = getLuminance(aoOut.ambientOcclusionColor);
        #endif

        float seo = environmentRadianceOcclusion(ambientMonochrome, NdotVUnclamped);
    #endif

    #ifdef HORIZONOCCLUSION
        #ifdef BUMP
            #ifdef REFLECTIONMAP_3D
                float eho = environmentHorizonOcclusion(-viewDirectionW, normalW, geometricNormalW);
            #endif
        #endif
    #endif
#endif
