#include<shadowMapFragmentDeclaration>

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

#include<clipPlaneFragmentDeclaration>

void main(void)
{
#include<clipPlaneFragment>

#ifdef ALPHATEST
    if (texture2D(diffuseSampler, vUV).a < 0.4)
        discard;
#endif

#include<shadowMapFragment>
}