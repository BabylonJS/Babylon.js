#ifdef DIFFUSE
varying vec2 vUVDiffuse;
uniform sampler2D diffuseSampler;
#endif

#ifdef OPACITY
varying vec2 vUVOpacity;
uniform sampler2D opacitySampler;
uniform float opacityIntensity;
#endif

#ifdef EMISSIVE
varying vec2 vUVEmissive;
uniform sampler2D emissiveSampler;
#endif

#ifdef VERTEXALPHA
    varying vec4 vColor;
#endif

uniform vec4 glowColor;

void main(void)
{

vec4 finalColor = glowColor;

// _____________________________ Alpha Information _______________________________
#ifdef DIFFUSE
    vec4 albedoTexture = texture2D(diffuseSampler, vUVDiffuse);

    #ifdef GLOW
        // In glow mode a is used to dim the opacity
        finalColor.a *= albedoTexture.a;
    #endif

    #ifdef HIGHLIGHT
        // While in highlight mode we only use the 3 colors
        finalColor.a = albedoTexture.a;
    #endif
#endif

#ifdef OPACITY
    vec4 opacityMap = texture2D(opacitySampler, vUVOpacity);

    #ifdef OPACITYRGB
        finalColor.a *= getLuminance(opacityMap.rgb);
    #else
        finalColor.a *= opacityMap.a;
    #endif

    finalColor.a *= opacityIntensity;
#endif

#ifdef VERTEXALPHA
    finalColor.a *= vColor.a;
#endif

#ifdef ALPHATEST
    if (finalColor.a < ALPHATESTVALUE)
        discard;
#endif

#ifdef EMISSIVE
    gl_FragColor = texture2D(emissiveSampler, vUVEmissive) * finalColor;
#else
    gl_FragColor = finalColor;
#endif

#ifdef HIGHLIGHT
    // a should stay untouched from the setup in highlight mode.
    gl_FragColor.a = glowColor.a;
#endif
}