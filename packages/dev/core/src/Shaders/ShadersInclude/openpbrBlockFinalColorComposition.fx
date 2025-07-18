vec4 finalColor = vec4(
#ifndef UNLIT
    #ifdef REFLECTION
        finalIrradiance +
    #endif
    #ifdef SPECULARTERM
        finalSpecularScaled +
    #endif
    #ifdef REFLECTION
        finalRadianceScaled +
    #endif
#endif
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
finalColor.rgb += finalEmission;

#define CUSTOM_FRAGMENT_BEFORE_FOG

// _____________________________ Finally ___________________________________________
finalColor = max(finalColor, 0.0);
