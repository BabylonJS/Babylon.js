#include<shadowMapFragmentExtraDeclaration>

#ifdef ALPHATEXTURE
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

#include<clipPlaneFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void)
{
#include<clipPlaneFragment>

#ifdef ALPHATEXTURE
    float alphaFromAlphaTexture = texture2D(diffuseSampler, vUV).a;
    #ifdef ALPHATESTVALUE
        if (alphaFromAlphaTexture < ALPHATESTVALUE)
            discard;
    #endif
#endif

#if SM_SOFTTRANSPARENTSHADOW == 1
    #ifdef ALPHATEXTURE
        if ((bayerDither8(floor(mod(gl_FragCoord.xy, 8.0)))) / 64.0 >= softTransparentShadowSM * alphaFromAlphaTexture) discard;
    #else
        if ((bayerDither8(floor(mod(gl_FragCoord.xy, 8.0)))) / 64.0 >= softTransparentShadowSM) discard;
    #endif
#endif

#include<shadowMapFragment>
}