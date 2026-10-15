precision highp float;
precision highp sampler3D;

#ifndef USE_EXACT_SRGB_CONVERSIONS
#define USE_EXACT_SRGB_CONVERSIONS
#endif
#include<helperFunctions>

varying vec2 vUV;
uniform sampler3D textureSampler;
uniform float lod;
uniform float slice;
uniform int gamma; // 0: display gamma, 1: preserve channels, 2: restore hardware sRGB.

void main(void)
{
    ivec3 textureCoordinates = ivec3(vUV * vec2(textureSize(textureSampler, 0).xy), int(slice));
    gl_FragColor = texelFetch(textureSampler, textureCoordinates, int(lod));
    if (gamma == 0) {
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(GammaEncodePowerApprox));
    } else if (gamma == 2) {
        gl_FragColor.rgb = toGammaSpaceExact(gl_FragColor.rgb);
    }
}
