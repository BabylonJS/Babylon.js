struct ambientOcclusionOutParams
{
    vec3 ambientOcclusionColor;
#if DEBUGMODE > 0 && defined(AMBIENT_OCCLUSION)
    vec3 ambientOcclusionColorMap;
#endif
};

ambientOcclusionOutParams ambientOcclusionBlock(
#ifdef AMBIENT_OCCLUSION
    in vec3 ambientOcclusionFromTexture,
    in vec2 ambientOcclusionInfos
#endif
)
{
    ambientOcclusionOutParams outParams;
    vec3 ambientOcclusionColor = vec3(1., 1., 1.);

    #ifdef AMBIENT_OCCLUSION
        ambientOcclusionColor = vec3(ambientOcclusionFromTexture.r * ambientOcclusionInfos.y);

        #if DEBUGMODE > 0
            outParams.ambientOcclusionColorMap = ambientOcclusionFromTexture;
        #endif
    #endif

    outParams.ambientOcclusionColor = ambientOcclusionColor;

    return outParams;
}
