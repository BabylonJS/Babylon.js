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
    ambientOcclusionFromTexture: vec3f,
    ambientOcclusionInfos: vec2f
#endif
) -> ambientOcclusionOutParams
{    
    var outParams: ambientOcclusionOutParams;
    var ambientOcclusionColor: vec3f =  vec3f(1., 1., 1.);

    #ifdef AMBIENT_OCCLUSION
        ambientOcclusionColor = vec3f(ambientOcclusionFromTexture.r * ambientOcclusionInfos.y);
        
        #if DEBUGMODE > 0
            outParams.ambientOcclusionColorMap = ambientOcclusionFromTexture;
        #endif
    #endif

    outParams.ambientOcclusionColor = ambientOcclusionColor;

    return outParams;
}
