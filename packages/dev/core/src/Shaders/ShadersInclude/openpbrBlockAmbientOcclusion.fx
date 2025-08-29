struct ambientOcclusionOutParams
{
    vec3 ambientOcclusionColor;
#if DEBUGMODE > 0 && defined(AMBIENT_OCCLUSION)
    vec3 ambientOcclusionColorMap;
#endif
};

ambientOcclusionOutParams ambientOcclusionBlock(
#ifdef AMBIENT_OCCLUSION
    in vec3 ambientOcclusionColorMap_,
    in vec2 ambientInfos
#endif
)
{
    ambientOcclusionOutParams outParams;
    vec3 ambientOcclusionColor = vec3(1., 1., 1.);

    #ifdef AMBIENT_OCCLUSION
        vec3 ambientOcclusionColorMap = ambientOcclusionColorMap_ * ambientInfos.y;
        #ifdef AMBIENTINGRAYSCALE
            ambientOcclusionColorMap = vec3(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
        #endif
        // ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, ambientInfos.z);

        #if DEBUGMODE > 0
            outParams.ambientOcclusionColorMap = ambientOcclusionColorMap;
        #endif
    #endif

    outParams.ambientOcclusionColor = ambientOcclusionColor;

    return outParams;
}
