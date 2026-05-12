#ifndef TEXRD_DEFINED
    #define TEXRD(t, ts, uv) textureSample(t, ts, uv)
#endif
#ifdef LIGHTMAP
    var lightmapColor: vec4f = TEXRD(lightmapSampler, lightmapSamplerSampler, fragmentInputs.vLightmapUV + uvOffset);

    #ifdef RGBDLIGHTMAP
        lightmapColor = vec4f(fromRGBD(lightmapColor), lightmapColor.a);
    #endif

    #ifdef GAMMALIGHTMAP
        lightmapColor = vec4f(toLinearSpaceVec3(lightmapColor.rgb), lightmapColor.a);
    #endif
    lightmapColor = vec4f(lightmapColor.rgb * uniforms.vLightmapInfos.y, lightmapColor.a);
#endif
