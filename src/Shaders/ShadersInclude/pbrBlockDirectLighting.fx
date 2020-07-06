vec3 diffuseBase = vec3(0., 0., 0.);
#ifdef SPECULARTERM
    vec3 specularBase = vec3(0., 0., 0.);
#endif
#ifdef CLEARCOAT
    vec3 clearCoatBase = vec3(0., 0., 0.);
#endif
#ifdef SHEEN
    vec3 sheenBase = vec3(0., 0., 0.);
#endif

#ifdef LIGHTMAP
    vec4 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset);

    #ifdef RGBDLIGHTMAP
        lightmapColor.rgb = fromRGBD(lightmapColor);
    #endif

    #ifdef GAMMALIGHTMAP
        lightmapColor.rgb = toLinearSpace(lightmapColor.rgb);
    #endif
    lightmapColor.rgb *= vLightmapInfos.y;
#endif

// Direct Lighting Variables
preLightingInfo preInfo;
lightingInfo info;
float shadow = 1.; // 1 - shadowLevel

#if defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
    vec3 absorption = vec3(0.);
#endif
