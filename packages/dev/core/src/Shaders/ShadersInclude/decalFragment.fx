#ifdef DECAL
    #ifdef GAMMADECAL
        decalColor.rgb = toLinearSpace(decalColor.rgb);
    #endif
    #ifdef DECAL_SMOOTHALPHA
        decalColor.a *= decalColor.a;
    #endif
    surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, decalColor.rgb, decalColor.a);
#endif
