var finalColor: vec4f =  vec4f(
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
            finalColor = vec4f(finalColor.rgb * lightmapColor.rgb, finalColor.a);
        #else
            finalColor = vec4f(finalColor.rgb + lightmapColor.rgb, finalColor.a);
        #endif
    #endif
#endif

// _____________________________ EmissiveLight _____________________________________
finalColor = vec4f(finalColor.rgb + finalEmissive, finalColor.a);

#define CUSTOM_FRAGMENT_BEFORE_FOG

// _____________________________ Finally ___________________________________________
finalColor = max(finalColor, vec4f(0.0));
