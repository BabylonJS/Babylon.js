struct ambientOcclusionOutParams
{
    vec3 ambientOcclusionColor;
#if DEBUGMODE > 0 && defined(AMBIENT)
    vec3 ambientOcclusionColorMap;
#endif
};

ambientOcclusionOutParams ambientOcclusionBlock(
#ifdef AMBIENT
    in vec3 ambientOcclusionColorMap_,
    in vec4 vAmbientInfos
#endif
)
{
    ambientOcclusionOutParams outParams;
    vec3 ambientOcclusionColor = vec3(1., 1., 1.);

    #ifdef AMBIENT
        vec3 ambientOcclusionColorMap = ambientOcclusionColorMap_ * vAmbientInfos.y;
        #ifdef AMBIENTINGRAYSCALE
            ambientOcclusionColorMap = vec3(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
        #endif
        ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, vAmbientInfos.z);

        #if DEBUGMODE > 0
            outParams.ambientOcclusionColorMap = ambientOcclusionColorMap;
        #endif
    #endif

    outParams.ambientOcclusionColor = ambientOcclusionColor;

    return outParams;
}
