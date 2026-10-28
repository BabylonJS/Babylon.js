#if defined(REFLECTION) || defined(SS_REFRACTION)
    float getLodFromAlphaG(float cubeMapDimensionPixels, float microsurfaceAverageSlope) {
        float microsurfaceAverageSlopeTexels = cubeMapDimensionPixels * microsurfaceAverageSlope;
        float lod = log2(microsurfaceAverageSlopeTexels);
        return lod;
    }

    float getLinearLodFromRoughness(float cubeMapDimensionPixels, float roughness) {
        float lod = log2(cubeMapDimensionPixels) * roughness;
        return lod;
    }
#endif

#if defined(ENVIRONMENTBRDF) && defined(RADIANCEOCCLUSION)
    float environmentRadianceOcclusion(float ambientOcclusion, float NdotVUnclamped) {
        // Best balanced (implementation time vs result vs perf) analytical environment specular occlusion found.
        // http://research.tri-ace.com/Data/cedec2011_RealtimePBR_Implementation_e.pptx
        float temp = NdotVUnclamped + ambientOcclusion;
        return saturate(square(temp) - 1.0 + ambientOcclusion);
    }
#endif

#if defined(BENTNORMAL) && defined(REFLECTION)
    // Spherical Gaussians are parameterized by spread = 1 / sharpness: G(v) = exp((dot(axis, v) - 1) / spread).
    // Returns the integral of the visibility SG times the reflection SG, divided by 2 * PI * reflectionSpread (a normalization
    // that cancels in the occlusion ratio). Every term stays finite when either spread reaches zero: a zero visibility spread
    // is fully closed and a zero reflection spread evaluates the visibility SG along the mirror direction.
    // https://therealmjp.github.io/posts/sg-series-part-2-spherical-gaussians-101/
    float bentNormalSGOverlap(float axisDistanceSquared, float spread, float reflectionSpread) {
        float distanceSquared = clamp(axisDistanceSquared, 0.0, 4.0);
        float spreadProduct = spread * reflectionSpread;
        float spreadDifference = spread - reflectionSpread;
        // Product lobe sharpness multiplied by spreadProduct.
        float productLength = sqrt(spreadDifference * spreadDifference + spreadProduct * (4.0 - distanceSquared));
        // Cancellation-free form of (productLength - spread - reflectionSpread) / spreadProduct.
        float exponent = -distanceSquared / max(productLength + spread + reflectionSpread, 1e-30);
        float x = 2.0 * productLength / max(spreadProduct, 1e-30);
        float overlap = spread * (1.0 - exp(-x)) / max(productLength, 1e-30);
        if (x < 0.01) {
            // Series of (1 - exp(-x)) / x for nearly cancelling lobe axes.
            overlap = 2.0 * spread / max(spreadProduct, 1e-30) * (1.0 - x * (0.5 - x / 6.0));
        }
        return exp(exponent) * overlap;
    }

    // SG approximation to reflection-weighted cone visibility, normalized by the open hemisphere.
    float bentNormalSGOcclusion(float bentDistanceSquared, float normalDistanceSquared, float NdotV, float ambientOcclusion, float alphaG) {
        float visibility = saturate(ambientOcclusion);
        // A cone centered on the normal has cosine-weighted visibility sin^2(theta).
        float coneCos = sqrt(1.0 - visibility);
        // 1 - coneCos without cancellation: 0 when closed and 1 for the open hemisphere, which is the reference spread.
        float visibilitySpread = visibility / (1.0 + coneCos);
        // GGX NDF fitted by an SG of spread alphaG^2 / 2, warped around the reflection direction.
        float reflectionSpread = 2.0 * alphaG * alphaG * saturate(NdotV);
        float visible = bentNormalSGOverlap(bentDistanceSquared, visibilitySpread, reflectionSpread);
        float hemisphere = bentNormalSGOverlap(normalDistanceSquared, 1.0, reflectionSpread);
        return min(1.0, visible / hemisphere);
    }

    float environmentBentNormalOcclusion(vec3 bentNormal, vec3 reflectionDirection, vec3 normal, float NdotV, float ambientOcclusion, float alphaG) {
        float visibility = saturate(ambientOcclusion);
        if (visibility == 0.0 || visibility == 1.0) {
            return visibility;
        }
        float coneSin = sqrt(visibility);
        float cosBentNormal = dot(bentNormal, normal);
        vec3 axis = bentNormal;
        if (cosBentNormal < coneSin) {
            // Keep the visibility cone inside the hemisphere and converge to its normal as AO opens.
            vec3 tangent = bentNormal - cosBentNormal * normal;
            float tangentLength = length(tangent);
            axis = normal;
            if (tangentLength > 1e-6) {
                axis = coneSin * normal + sqrt(1.0 - visibility) * tangent / tangentLength;
            }
        }
        // Squared vector differences preserve narrow-lobe angles that 1 - dot(axis, reflectionDirection) loses in float32.
        vec3 bentDelta = axis - reflectionDirection;
        vec3 normalDelta = normal - reflectionDirection;
        return bentNormalSGOcclusion(dot(bentDelta, bentDelta), dot(normalDelta, normalDelta), NdotV, visibility, alphaG);
    }
#endif

#if defined(ENVIRONMENTBRDF) && defined(HORIZONOCCLUSION)
    float environmentHorizonOcclusion(vec3 view, vec3 normal, vec3 geometricNormal) {
        // http://marmosetco.tumblr.com/post/81245981087
        vec3 reflection = reflect(view, normal);
        float temp = saturate(1.0 + 1.1 * dot(reflection, geometricNormal));
        return square(temp);
    }
#endif

// ___________________________________________________________________________________
//
// LEGACY
// ___________________________________________________________________________________

#if defined(LODINREFLECTIONALPHA) || defined(SS_LODINREFRACTIONALPHA)
    // To enable 8 bit textures to be used we need to pack and unpack the LOD
    //inverse alpha is used to work around low-alpha bugs in Edge and Firefox
    #define UNPACK_LOD(x) (1.0 - x) * 255.0

    float getLodFromAlphaG(float cubeMapDimensionPixels, float alphaG, float NdotV) {
        float microsurfaceAverageSlope = alphaG;

        // Compensate for solid angle change between half-vector measure (Blinn-Phong) and reflected-vector measure (Phong):
        //  dWr = 4*cos(theta)*dWh,
        // where dWr = solid angle (delta omega) in environment incident radiance (reflection-vector) measure;
        // where dWh = solid angle (delta omega) in microfacet normal (half-vector) measure;
        // so the relationship is proportional to cosine theta = NdotV.
        // The constant factor of four is handled elsewhere as part of the scale/offset filter parameters.
        microsurfaceAverageSlope *= sqrt(abs(NdotV));

        return getLodFromAlphaG(cubeMapDimensionPixels, microsurfaceAverageSlope);
    }
#endif