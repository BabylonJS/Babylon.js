precision highp sampler2D;
precision highp samplerCube;

#include<helperFunctions>

#define PI 3.1415927
varying vec2 vUV;

#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform int iblWidth;
uniform int iblHeight;

#ifdef IBL_USE_CUBE_MAP
vec3 equirectangularToCubemapDirection(vec2 uv) {
  float longitude = uv.x * 2.0 * PI - PI;
  float latitude = PI * 0.5 - uv.y * PI;
  vec3 direction;
  direction.x = cos(latitude) * sin(longitude);
  direction.y = sin(latitude);
  direction.z = cos(latitude) * cos(longitude);
  return direction;
}
#endif

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
    // Compute total normalized luminance of texture.
    float normalization = 0.0;
    float fWidth = float(iblWidth);
    float fHeight = float(iblHeight);
    for (int y = 0; y < iblHeight; y++) {
        float yCoord = (float(y) + 0.5) / fHeight;
        float deform = sin(yCoord * PI);
        for (int x = 0; x < iblWidth; x++) {
            float xCoord = max(min((float(x) + 0.5) / fWidth, 1.0), 0.0);
            float luminance = fetchLuminance(vec2(xCoord, yCoord));
            normalization += deform * luminance;
        }
    }

    normalization = fWidth * fHeight / (2.0 * PI * normalization);
    gl_FragColor = vec4(vec3(normalization), 1.0);
}