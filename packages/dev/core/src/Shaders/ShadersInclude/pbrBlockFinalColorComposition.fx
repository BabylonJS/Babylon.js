vec4 finalColor = vec4(
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
        finalAmbient +
        finalDiffuse,
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

// _____________________________ EmissiveLight _____________________________________
finalColor.rgb += finalEmissive;

#define CUSTOM_FRAGMENT_BEFORE_FOG

// _____________________________ Finally ___________________________________________
finalColor = max(finalColor, 0.0);
