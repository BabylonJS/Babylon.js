vec3 finalDirectLightingColor = vec3(
#ifndef UNLIT
    #ifdef SPECULARTERM
        finalSpecularScaled +
    #endif
    #ifdef CLEARCOAT
        finalClearCoatScaled +
    #endif
    #ifdef SHEEN
        finalSheenScaled +
    #endif
    #ifdef SS_REFRACTION
        subSurfaceOut.finalRefraction +
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
#endif
    vec3(0.0)
);

// _____________________________ Finally ___________________________________________
finalDirectLightingColor = max(finalDirectLightingColor, 0.0);
