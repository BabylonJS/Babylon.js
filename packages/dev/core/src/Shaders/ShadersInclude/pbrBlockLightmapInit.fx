#ifndef TEXRD_DEFINED
    #define TEXRD(s, uv) texture2D(s, uv)
#endif
#ifdef LIGHTMAP
    vec4 lightmapColor = TEXRD(lightmapSampler, vLightmapUV + uvOffset);

    #ifdef RGBDLIGHTMAP
        lightmapColor.rgb = fromRGBD(lightmapColor);
    #endif

    #ifdef GAMMALIGHTMAP
        lightmapColor.rgb = toLinearSpace(lightmapColor.rgb);
    #endif
    lightmapColor.rgb *= vLightmapInfos.y;
#endif
