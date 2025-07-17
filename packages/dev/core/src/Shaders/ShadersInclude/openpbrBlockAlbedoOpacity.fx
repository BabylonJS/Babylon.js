struct albedoOpacityOutParams
{
    vec3 surfaceAlbedo;
    float alpha;
};

#define pbr_inline
albedoOpacityOutParams albedoOpacityBlock(
    in vec4 vAlbedoColor
#ifdef BASE_COLOR
    ,in vec4 albedoTexture
    ,in vec2 albedoInfos
#endif
    , in float baseWeight
#ifdef BASE_WEIGHT
    , in vec4 baseWeightTexture
    , in vec2 vBaseWeightInfos
#endif
#ifdef OPACITY
    ,in vec4 opacityMap
    ,in vec2 vOpacityInfos
#endif
#ifdef DETAIL
    ,in vec4 detailColor
    ,in vec4 vDetailInfos
#endif
#ifdef DECAL
    ,in vec4 decalColor
    ,in vec4 vDecalInfos
#endif
)
{
    albedoOpacityOutParams outParams;
    // _____________________________ Albedo Information ______________________________
    vec3 surfaceAlbedo = vAlbedoColor.rgb;
    float alpha = vAlbedoColor.a;

    #ifdef BASE_COLOR
        #if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)
            alpha *= albedoTexture.a;
        #endif

        #ifdef BASE_COLOR_GAMMA
            surfaceAlbedo *= toLinearSpace(albedoTexture.rgb);
        #else
            surfaceAlbedo *= albedoTexture.rgb;
        #endif

        surfaceAlbedo *= albedoInfos.y;
    #endif

    #ifndef DECAL_AFTER_DETAIL
        #include<decalFragment>
    #endif

    #if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
        surfaceAlbedo *= vColor.rgb;
    #endif

    #ifdef DETAIL
        float detailAlbedo = 2.0 * mix(0.5, detailColor.r, vDetailInfos.y);
        surfaceAlbedo.rgb = surfaceAlbedo.rgb * detailAlbedo * detailAlbedo; // should be pow(detailAlbedo, 2.2) but detailAlbedo² is close enough and cheaper to compute
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
        alpha *= vColor.a;
    #endif

    #if !defined(SS_LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)
        #ifdef ALPHATEST
            #if DEBUGMODE != 88
                if (alpha < ALPHATESTVALUE)
                    discard;
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
