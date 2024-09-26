#ifdef DECAL
    var decalTempColor = decalColor.rgb;
    var decalTempAlpha = decalColor.a;
    #ifdef GAMMADECAL
        decalTempColor = toLinearSpaceVec3(decalColor.rgb);
    #endif
    #ifdef DECAL_SMOOTHALPHA
        decalTempAlpha = decalColor.a * decalColor.a;
    #endif
    surfaceAlbedo = vec4f(mix(surfaceAlbedo.rgb, decalTempColor, decalTempAlpha), surfaceAlbedo.a);
#endif
