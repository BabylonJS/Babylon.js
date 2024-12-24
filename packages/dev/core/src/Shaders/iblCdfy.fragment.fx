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
uniform int iblHeight;

#ifdef IBL_USE_CUBE_MAP
float fetchCube(vec2 uv) {
  vec3 direction = equirectangularToCubemapDirection(uv);
  return sin(PI * uv.y) * dot(textureCubeLodEXT(iblSource, direction, 0.0).rgb, LuminanceEncodeApprox);
}
#else

float fetchPanoramic(ivec2 Coords, float envmapHeight) {
  return sin(PI * (float(Coords.y) + 0.5) / envmapHeight) *
         dot(texelFetch(iblSource, Coords, 0).rgb, LuminanceEncodeApprox);
}
#endif

void main(void) {
  ivec2 coords = ivec2(gl_FragCoord.x, gl_FragCoord.y);
  float cdfy = 0.0;
  for (int y = 1; y <= coords.y; y++) {
#ifdef IBL_USE_CUBE_MAP
      vec2 uv = vec2(vUV.x, (float(y - 1) + 0.5) / float(iblHeight));
      cdfy += fetchCube(uv);
#else
      cdfy += fetchPanoramic(ivec2(coords.x, y - 1), float(iblHeight));
#endif
    }
    gl_FragColor = vec4(cdfy, 0.0, 0.0, 1.0);
}