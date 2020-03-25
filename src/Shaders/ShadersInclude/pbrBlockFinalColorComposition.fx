vec4 finalColor = vec4(
        finalAmbient +
        finalDiffuse +
#ifndef UNLIT
    #ifdef REFLECTION
        finalIrradiance +
    #endif
    #ifdef SPECULARTERM
        finalSpecularScaled +
    #endif
    #ifdef SHEEN
        finalSheenScaled +
    #endif
    #ifdef CLEARCOAT
        finalClearCoatScaled +
    #endif
    #ifdef REFLECTION
        finalRadianceScaled +
        #if defined(SHEEN) && defined(ENVIRONMENTBRDF)
            sheenOut.finalSheenRadianceScaled +
        #endif
        #ifdef CLEARCOAT
            clearcoatOut.finalClearCoatRadianceScaled +
        #endif
    #endif
    #ifdef SS_REFRACTION
        subSurfaceOut.finalRefraction +
    #endif
#endif
        finalEmissive,
        alpha);

// _____________________________ LightMappping _____________________________________
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            finalColor.rgb *= lightmapColor.rgb;
        #else
            finalColor.rgb += lightmapColor.rgb;
        #endif
    #endif
#endif

#define CUSTOM_FRAGMENT_BEFORE_FOG

// _____________________________ Finally ___________________________________________
finalColor = max(finalColor, 0.0);
