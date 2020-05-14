struct ambientOcclusionOutParams
{
    vec3 ambientOcclusionColor;
#if DEBUGMODE > 0
    vec3 ambientOcclusionColorMap;
#endif
};

#define pbr_inline
void ambientOcclusionBlock(
#ifdef AMBIENT
    const in vec3 ambientOcclusionColorMap_,
    const in vec4 vAmbientInfos,
#endif
    out ambientOcclusionOutParams outParams
)
{
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
}
