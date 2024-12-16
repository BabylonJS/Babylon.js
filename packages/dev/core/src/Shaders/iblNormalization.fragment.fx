precision highp sampler2D;
precision highp samplerCube;

#include<helperFunctions>

varying vec2 vUV;

#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
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
    // Scale luminance to account for latitude (pixels near the pole represent less surface area of the sphere)
    float deform = sin(vUV.y * PI);
    float luminance = fetchLuminance(vUV);
    gl_FragColor = vec4(vec3(deform * luminance), 1.0);
}