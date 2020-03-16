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