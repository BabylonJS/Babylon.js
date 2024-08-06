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