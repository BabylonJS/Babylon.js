struct albedoOpacityOutParams
{
    vec3 surfaceAlbedo;
    float alpha;
};

#define pbr_inline
void albedoOpacityBlock(
    const in vec4 vAlbedoColor,
#ifdef ALBEDO
    const in vec4 albedoTexture,
    const in vec2 albedoInfos,
#endif
#ifdef OPACITY
    const in vec4 opacityMap,
    const in vec2 vOpacityInfos,
#endif
#ifdef DETAIL
    const in vec4 detailColor,
    const in vec4 vDetailInfos,
#endif
    out albedoOpacityOutParams outParams
)
{
    // _____________________________ Albedo Information ______________________________
    vec3 surfaceAlbedo = vAlbedoColor.rgb;
    float alpha = vAlbedoColor.a;

    #ifdef ALBEDO
        #if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)
            alpha *= albedoTexture.a;
        #endif

        #ifdef GAMMAALBEDO
            surfaceAlbedo *= toLinearSpace(albedoTexture.rgb);
        #else
            surfaceAlbedo *= albedoTexture.rgb;
        #endif

        surfaceAlbedo *= albedoInfos.y;
    #endif

    #ifdef VERTEXCOLOR
        surfaceAlbedo *= vColor.rgb;
    #endif

    #ifdef DETAIL
        float detailAlbedo = 2.0 * mix(0.5, detailColor.r, vDetailInfos.y);
        surfaceAlbedo.rgb = surfaceAlbedo.rgb * detailAlbedo * detailAlbedo; // should be pow(detailAlbedo, 2.2) but detailAlbedo² is close enough and cheaper to compute
    #endif

    #define CUSTOM_FRAGMENT_UPDATE_ALBEDO

    // _____________________________ Alpha Information _______________________________
    #ifdef OPACITY
        #ifdef OPACITYRGB
            alpha = getLuminance(opacityMap.rgb);
        #else
            alpha *= opacityMap.a;
        #endif

        alpha *= vOpacityInfos.y;
    #endif

    #ifdef VERTEXALPHA
        alpha *= vColor.a;
    #endif

    #if !defined(SS_LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)
        #ifdef ALPHATEST
            if (alpha < ALPHATESTVALUE)
                discard;

            #ifndef ALPHABLEND
                // Prevent to blend with the canvas.
                alpha = 1.0;
            #endif
        #endif
    #endif

    outParams.surfaceAlbedo = surfaceAlbedo;
    outParams.alpha = alpha;
}
