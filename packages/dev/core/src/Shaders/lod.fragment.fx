precision highp float;

#ifndef USE_EXACT_SRGB_CONVERSIONS
#define USE_EXACT_SRGB_CONVERSIONS
#endif
#include<helperFunctions>

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
uniform vec2 texSize;
uniform int gamma; // 0: display gamma, 1: preserve channels, 2: restore hardware sRGB.
void main(void)
{
    ivec2 textureDimensions = textureSize(textureSampler, 0);
    gl_FragColor = texelFetch(textureSampler, ivec2(vUV * vec2(textureDimensions)), int(lod));
    if (gamma == 0) {
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(GammaEncodePowerApprox));
    } else if (gamma == 2) {
        gl_FragColor.rgb = toGammaSpaceExact(gl_FragColor.rgb);
    }
}
