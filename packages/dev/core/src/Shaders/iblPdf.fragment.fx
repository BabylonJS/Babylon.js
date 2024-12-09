
precision highp sampler2D;
precision highp samplerCube;

#include<helperFunctions>

varying vec2 vUV;

#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform sampler2D normalizationSampler;
uniform int iblWidth;
uniform int iblHeight;

float fetchLuminance(vec2 coords) {
    #ifdef IBL_USE_CUBE_MAP
        vec3 direction = equirectangularToCubemapDirection(coords);
        vec3 color = textureCubeLodEXT(iblSource, direction, 0.0).rgb;
    #else
        vec3 color = textureLod(iblSource, coords, 0.0).rgb;
    #endif
    // apply same luminance computation as in the CDF shader
    return dot(color, LuminanceEncodeApprox);
}


void main(void) {
    float normalization = texture(normalizationSampler, vec2(0.0)).r;

    // Compute the luminance of the current pixel and normalize it
    float pixelLuminance = fetchLuminance(vUV);
    gl_FragColor = vec4(vec3(pixelLuminance * normalization), 1.0);
}