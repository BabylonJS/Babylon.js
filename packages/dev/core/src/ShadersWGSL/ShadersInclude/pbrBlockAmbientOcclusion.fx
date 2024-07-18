struct ambientOcclusionOutParams
{
    var ambientOcclusionColor: vec3f;
#if DEBUGMODE > 0 && defined(AMBIENT)
    var ambientOcclusionColorMap: vec3f;
#endif
};

#define pbr_inline
var ambientOcclusionBlock: voidnull(
#ifdef AMBIENT
    in var ambientOcclusionColorMap_: vec3f,
    in var vAmbientInfos: vec4f,
#endif
    out ambientOcclusionOutParams outParams
)
{
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
}
