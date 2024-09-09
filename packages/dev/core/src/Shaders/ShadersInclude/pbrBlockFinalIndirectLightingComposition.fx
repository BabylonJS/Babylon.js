vec4 finalIndirectLightingColor = vec4(
#ifndef UNLIT
    #ifdef REFLECTION
        finalIrradiance +
    #endif
#endif
        finalAmbient +
        finalDiffuse,
        alpha);

// _____________________________ LightMappping _____________________________________
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            finalIndirectLightingColor.rgb *= lightmapColor.rgb;
        #else
            finalIndirectLightingColor.rgb += lightmapColor.rgb;
        #endif
    #endif
#endif

#define CUSTOM_FRAGMENT_BEFORE_FOG

// _____________________________ Finally ___________________________________________
finalIndirectLightingColor = max(finalIndirectLightingColor, 0.0);
