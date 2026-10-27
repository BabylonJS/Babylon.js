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
    float bentNormalSGLogIntegral(float concentration) {
        if (concentration < 0.001) {
            return 0.69314718056 + concentration * concentration / 6.0;
        }
        return concentration + log(1.0 - exp(-2.0 * concentration)) - log(concentration);
    }

    float environmentBentNormalOcclusion(vec3 bentNormal, vec3 reflectionDirection, vec3 normal, vec3 view, float ambientOcclusion, float roughness) {
        // Independently evaluated spherical-Gaussian product integrals, normalized by an unoccluded hemisphere.
        // Log space avoids overflow for narrow visibility and reflection lobes.
        // https://therealmjp.github.io/posts/sg-series-part-2-spherical-gaussians-101/
        float visibilityConcentration = 1.0 / max(1.0 - sqrt(1.0 - saturate(ambientOcclusion)), 0.001);
        float alpha = roughness * roughness;
        float reflectionConcentration = 0.5 / max(alpha * alpha * dot(normal, view), 0.001);
        vec3 reflectionAxis = reflectionDirection * reflectionConcentration;
        float visibleIntegral = bentNormalSGLogIntegral(length(reflectionAxis + visibilityConcentration * bentNormal));
        float hemisphereIntegral = bentNormalSGLogIntegral(length(reflectionAxis + 0.8 * normal));
        return exp(min(0.0, visibleIntegral - hemisphereIntegral + 0.8 - visibilityConcentration));
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