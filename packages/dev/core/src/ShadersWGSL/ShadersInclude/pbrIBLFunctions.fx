#if defined(REFLECTION) || defined(SS_REFRACTION)
    fn getLodFromAlphaG(cubeMapDimensionPixels: f32, microsurfaceAverageSlope: f32) -> f32 {
        var microsurfaceAverageSlopeTexels: f32 = cubeMapDimensionPixels * microsurfaceAverageSlope;
        var lod: f32 = log2(microsurfaceAverageSlopeTexels);
        return lod;
    }

    fn getLinearLodFromRoughness(cubeMapDimensionPixels: f32, roughness: f32) -> f32 {
        var lod: f32 = log2(cubeMapDimensionPixels) * roughness;
        return lod;
    }
#endif

#if defined(ENVIRONMENTBRDF) && defined(RADIANCEOCCLUSION)
    fn environmentRadianceOcclusion(ambientOcclusion: f32, NdotVUnclamped: f32) -> f32 {
        // Best balanced (implementation time vs result vs perf) analytical environment specular occlusion found.
        // http://research.tri-ace.com/Data/cedec2011_RealtimePBR_Implementation_e.pptx
        var temp: f32 = NdotVUnclamped + ambientOcclusion;
        return saturate(temp * temp - 1.0 + ambientOcclusion);
    }
#endif

#if defined(BENTNORMAL) && defined(REFLECTION)
    // Spherical Gaussians are parameterized by spread = 1 / sharpness: G(v) = exp((dot(axis, v) - 1) / spread).
    // Returns the integral of the visibility SG times the reflection SG, divided by 2 * PI * reflectionSpread (a normalization
    // that cancels in the occlusion ratio). Every term stays finite when either spread reaches zero: a zero visibility spread
    // is fully closed and a zero reflection spread evaluates the visibility SG along the mirror direction.
    // https://therealmjp.github.io/posts/sg-series-part-2-spherical-gaussians-101/
    fn bentNormalSGOverlap(axisDistanceSquared: f32, spread: f32, reflectionSpread: f32) -> f32 {
        let distanceSquared: f32 = clamp(axisDistanceSquared, 0.0, 4.0);
        let spreadProduct: f32 = spread * reflectionSpread;
        let spreadDifference: f32 = spread - reflectionSpread;
        // Product lobe sharpness multiplied by spreadProduct.
        let productLength: f32 = sqrt(spreadDifference * spreadDifference + spreadProduct * (4.0 - distanceSquared));
        // Cancellation-free form of (productLength - spread - reflectionSpread) / spreadProduct.
        let exponent: f32 = -distanceSquared / max(productLength + spread + reflectionSpread, 1e-30);
        let x: f32 = 2.0 * productLength / max(spreadProduct, 1e-30);
        var overlap: f32 = spread * (1.0 - exp(-x)) / max(productLength, 1e-30);
        if (x < 0.01) {
            // Series of (1 - exp(-x)) / x for nearly cancelling lobe axes.
            overlap = 2.0 * spread / max(spreadProduct, 1e-30) * (1.0 - x * (0.5 - x / 6.0));
        }
        return exp(exponent) * overlap;
    }

    // SG approximation to reflection-weighted cone visibility, normalized by the open hemisphere.
    fn bentNormalSGOcclusion(bentDistanceSquared: f32, normalDistanceSquared: f32, NdotV: f32, ambientOcclusion: f32, alphaG: f32) -> f32 {
        let visibility: f32 = saturate(ambientOcclusion);
        // A cone centered on the normal has cosine-weighted visibility sin^2(theta).
        let coneCos: f32 = sqrt(1.0 - visibility);
        // 1 - coneCos without cancellation: 0 when closed and 1 for the open hemisphere, which is the reference spread.
        let visibilitySpread: f32 = visibility / (1.0 + coneCos);
        // GGX NDF fitted by an SG of spread alphaG^2 / 2, warped around the reflection direction.
        let reflectionSpread: f32 = 2.0 * alphaG * alphaG * saturate(NdotV);
        let visible: f32 = bentNormalSGOverlap(bentDistanceSquared, visibilitySpread, reflectionSpread);
        let hemisphere: f32 = bentNormalSGOverlap(normalDistanceSquared, 1.0, reflectionSpread);
        return min(1.0, visible / hemisphere);
    }

    fn environmentBentNormalOcclusion(bentNormal: vec3f, reflectionDirection: vec3f, normal: vec3f, NdotV: f32, ambientOcclusion: f32, alphaG: f32) -> f32 {
        let visibility: f32 = saturate(ambientOcclusion);
        if (visibility == 0.0 || visibility == 1.0) {
            return visibility;
        }
        let coneSin: f32 = sqrt(visibility);
        let cosBentNormal: f32 = dot(bentNormal, normal);
        var axis: vec3f = bentNormal;
        if (cosBentNormal < coneSin) {
            // Keep the visibility cone inside the hemisphere and converge to its normal as AO opens.
            let tangent: vec3f = bentNormal - cosBentNormal * normal;
            let tangentLength: f32 = length(tangent);
            axis = normal;
            if (tangentLength > 1e-6) {
                axis = coneSin * normal + sqrt(1.0 - visibility) * tangent / tangentLength;
            }
        }
        // Squared vector differences preserve narrow-lobe angles that 1 - dot(axis, reflectionDirection) loses in float32.
        let bentDelta: vec3f = axis - reflectionDirection;
        let normalDelta: vec3f = normal - reflectionDirection;
        return bentNormalSGOcclusion(dot(bentDelta, bentDelta), dot(normalDelta, normalDelta), NdotV, visibility, alphaG);
    }
#endif

#if defined(ENVIRONMENTBRDF) && defined(HORIZONOCCLUSION)
    fn environmentHorizonOcclusion(view: vec3f, normal: vec3f, geometricNormal: vec3f) -> f32 {
        // http://marmosetco.tumblr.com/post/81245981087
        var reflection: vec3f = reflect(view, normal);
        var temp: f32 = saturate(1.0 + 1.1 * dot(reflection, geometricNormal));
        return temp * temp;
    }
#endif

// ___________________________________________________________________________________
//
// LEGACY
// ___________________________________________________________________________________

#if defined(LODINREFLECTIONALPHA) || defined(SS_LODINREFRACTIONALPHA)
    // To enable 8 bit textures to be used we need to pack and unpack the LOD
    //inverse alpha is used to work around low-alpha bugs in Edge and Firefox
    fn UNPACK_LOD(x: f32) -> f32 {
        return (1.0 - x) * 255.0;
    }

    fn getLodFromAlphaGNdotV(cubeMapDimensionPixels: f32, alphaG: f32, NdotV: f32) -> f32 {
        var microsurfaceAverageSlope: f32 = alphaG;

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