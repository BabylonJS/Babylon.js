struct ambientOcclusionOutParams
{
    ambientOcclusionColor: vec3f,
#if DEBUGMODE > 0 && defined(AMBIENT)
    ambientOcclusionColorMap: vec3f
#endif
};

#define pbr_inline
fn ambientOcclusionBlock(
#ifdef AMBIENT
    ambientOcclusionColorMap_: vec3f,
    vAmbientInfos: vec4f
#endif
) -> ambientOcclusionOutParams
{    
    var outParams: ambientOcclusionOutParams;
    var ambientOcclusionColor: vec3f =  vec3f(1., 1., 1.);

    #ifdef AMBIENT
        var ambientOcclusionColorMap: vec3f = ambientOcclusionColorMap_ * vAmbientInfos.y;
        #ifdef AMBIENTINGRAYSCALE
            ambientOcclusionColorMap =  vec3f(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
        #endif
        ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, vAmbientInfos.z);

        #if DEBUGMODE > 0
            outParams.ambientOcclusionColorMap = ambientOcclusionColorMap;
        #endif
    #endif

    outParams.ambientOcclusionColor = ambientOcclusionColor;

    return outParams;
}
