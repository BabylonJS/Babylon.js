uniform float conversion;

uniform sampler2D textureSampler;
uniform float lodLevel;

varying vec2 vUV;

#include<helperFunctions>

void main(void) 
{
#ifdef NO_SAMPLER
    vec4 color = texelFetch(textureSampler, ivec2(gl_FragCoord.xy), 0);
#else
    vec4 color = textureLod(textureSampler, vUV, lodLevel);
#endif

#ifdef DEPTH_TEXTURE
    gl_FragDepth = color.r;
#else
    if (conversion == 1.) {
        color = toLinearSpace(color);
    } else if (conversion == 2.) {
        color = toGammaSpace(color);
    }

    gl_FragColor = color;
#endif
}
