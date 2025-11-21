struct ambientOcclusionOutParams
{
    ambientOcclusionColor: vec3f,
#if DEBUGMODE > 0 && defined(AMBIENT_OCCLUSION)
    ambientOcclusionColorMap: vec3f
#endif
};

#define pbr_inline
fn ambientOcclusionBlock(
#ifdef AMBIENT_OCCLUSION
    ambientOcclusionColorMap_: vec3f,
    ambientInfos: vec2f
#endif
) -> ambientOcclusionOutParams
{    
    var outParams: ambientOcclusionOutParams;
    var ambientOcclusionColor: vec3f =  vec3f(1., 1., 1.);

    #ifdef AMBIENT_OCCLUSION
        var ambientOcclusionColorMap: vec3f = ambientOcclusionColorMap_ * ambientInfos.y;
        #ifdef AMBIENTINGRAYSCALE
            ambientOcclusionColorMap =  vec3f(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
        #endif
        // ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, ambientInfos.z);

        #if DEBUGMODE > 0
            outParams.ambientOcclusionColorMap = ambientOcclusionColorMap;
        #endif
    #endif

    outParams.ambientOcclusionColor = ambientOcclusionColor;

    return outParams;
}
