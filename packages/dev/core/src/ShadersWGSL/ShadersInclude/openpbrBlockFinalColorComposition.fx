var finalColor: vec4f =  vec4f(
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
            finalColor = vec4f(finalColor.rgb * lightmapColor.rgb, finalColor.a);
        #else
            finalColor = vec4f(finalColor.rgb + lightmapColor.rgb, finalColor.a);
        #endif
    #endif
#endif

// _____________________________ EmissiveLight _____________________________________
finalColor = vec4f(finalColor.rgb + finalEmission, finalColor.a);

#define CUSTOM_FRAGMENT_BEFORE_FOG

// _____________________________ Finally ___________________________________________
finalColor = max(finalColor, vec4f(0.0));
