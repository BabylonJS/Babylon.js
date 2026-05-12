#ifndef TEXRD_DEFINED
    fn TEXRD(t: texture_2d<f32>, ts: sampler, uv: vec2f) -> vec4f {
        return textureSample(t, ts, uv);
    }
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
