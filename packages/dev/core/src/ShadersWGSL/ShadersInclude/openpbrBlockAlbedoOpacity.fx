struct albedoOpacityOutParams
{
    surfaceAlbedo: vec3f,
    alpha: f32
};

#define pbr_inline
fn albedoOpacityBlock(
    vAlbedoColor: vec4f
#ifdef BASE_COLOR
    ,albedoTexture: vec4f
    ,albedoInfos: vec2f
#endif
    , baseWeight: f32
#ifdef BASE_WEIGHT
    , baseWeightTexture: vec4f
    , vBaseWeightInfos: vec2f
#endif
#ifdef OPACITY
    ,opacityMap: vec4f
    ,vOpacityInfos: vec2f
#endif
#ifdef DETAIL
    ,detailColor: vec4f
    ,vDetailInfos: vec4f
#endif
#ifdef DECAL
    ,decalColor: vec4f
    ,vDecalInfos: vec4f
#endif
) -> albedoOpacityOutParams
{
    var outParams: albedoOpacityOutParams;
    // _____________________________ Albedo Information ______________________________
    var surfaceAlbedo: vec3f = vAlbedoColor.rgb;
    var alpha: f32 = vAlbedoColor.a;

    #ifdef BASE_COLOR
        #if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)
            alpha *= albedoTexture.a;
        #endif

        #ifdef BASE_COLOR_GAMMA
            surfaceAlbedo *= toLinearSpaceVec3(albedoTexture.rgb);
        #else
            surfaceAlbedo *= albedoTexture.rgb;
        #endif

        surfaceAlbedo *= albedoInfos.y;
    #endif

    #ifndef DECAL_AFTER_DETAIL
        #include<decalFragment>
    #endif

    #if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
        surfaceAlbedo *= fragmentInputs.vColor.rgb;
    #endif

    #ifdef DETAIL
        var detailAlbedo: f32 = 2.0 * mix(0.5, detailColor.r, vDetailInfos.y);
        surfaceAlbedo = surfaceAlbedo.rgb * detailAlbedo * detailAlbedo; // should be pow(detailAlbedo, 2.2) but detailAlbedo² is close enough and cheaper to compute
    #endif

    #ifdef DECAL_AFTER_DETAIL
        #include<decalFragment>
    #endif

    #define CUSTOM_FRAGMENT_UPDATE_ALBEDO

    // According to OpenPBR:
    // - for metals, base_weight is a factor to the base_color (F0, thus surfaceAlbedo in
    //   Babylons.js).
    // - for dielectrics, base_weight is a factor to the diffuse BRDF (i.e. it should be
    //   applied in computeDiffuseLighting), but with the diffuse model *currently* used
    //   in Babylon.js, factoring it into the surfaceAlbedo is equivalent.
    surfaceAlbedo *= baseWeight;
    #ifdef BASE_WEIGHT
        surfaceAlbedo *= baseWeightTexture.r;
    #endif

    // _____________________________ Alpha Information _______________________________
    #ifdef OPACITY
        #ifdef OPACITYRGB
            alpha = getLuminance(opacityMap.rgb);
        #else
            alpha *= opacityMap.a;
        #endif

        alpha *= vOpacityInfos.y;
    #endif

    #if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
        alpha *= fragmentInputs.vColor.a;
    #endif

    #if !defined(SS_LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)
        #ifdef ALPHATEST
            #if DEBUGMODE != 88
                if (alpha < ALPHATESTVALUE) {
                    discard;
                }
            #endif

            #ifndef ALPHABLEND
                // Prevent to blend with the canvas.
                alpha = 1.0;
            #endif
        #endif
    #endif

    outParams.surfaceAlbedo = surfaceAlbedo;
    outParams.alpha = alpha;

    return outParams;
}
