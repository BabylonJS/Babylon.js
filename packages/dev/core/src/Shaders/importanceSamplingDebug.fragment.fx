precision highp samplerCube;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D cdfy;
uniform sampler2D icdfy;
uniform sampler2D cdfx;
uniform sampler2D icdfx;
#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform sampler2D textureSampler;
#define cdfyVSize 0.4
#define cdfxVSize 0.1
#define cdfyHSize 0.5

uniform vec4 sizeParams;
#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w
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
void main(void) {
  vec3 colour = vec3(0.0);
  vec2 uv =
      vec2((offsetX + vUV.x) * widthScale, (offsetY + vUV.y) * heightScale);
  vec3 backgroundColour = texture2D(textureSampler, vUV).rgb;

  const float iblStart = 1.0 - cdfyVSize;
  const float cdfyStart = 1.0 - 2.0 * cdfyVSize;
  const float cdfxStart = 1.0 - 2.0 * cdfyVSize - cdfxVSize;
  const float icdfxStart = 1.0 - 2.0 * cdfyVSize - 2.0 * cdfxVSize;
  // ***** Display all slices as a grid *******
#ifdef IBL_USE_CUBE_MAP

  vec3 direction = equirectangularToCubemapDirection(
      (uv - vec2(0.0, iblStart)) * vec2(1.0, 1.0 / cdfyVSize));
  vec3 iblColour = textureCubeLodEXT(iblSource, direction, 0.0).rgb;
#else
  vec3 iblColour = texture2D(iblSource, (uv - vec2(0.0, iblStart)) *
                                            vec2(1.0, 1.0 / cdfyVSize))
                       .rgb;
#endif
  float cdfyColour =
      texture2D(cdfy, (uv - vec2(0.0, cdfyStart)) * vec2(2.0, 1.0 / cdfyVSize))
          .r;
  float icdfyColour =
      texture2D(icdfy, (uv - vec2(0.5, cdfyStart)) * vec2(2.0, 1.0 / cdfyVSize))
          .r;
  float cdfxColour =
      texture2D(cdfx, (uv - vec2(0.0, cdfxStart)) * vec2(1.0, 1.0 / cdfxVSize))
          .r;
  float icdfxColour = texture2D(icdfx, (uv - vec2(0.0, icdfxStart)) *
                                           vec2(1.0, 1.0 / cdfxVSize))
                          .r;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    colour = backgroundColour;
  } else if (uv.y > iblStart) {
    colour += iblColour;
  } else if (uv.y > cdfyStart && uv.x < 0.5) {
    colour.r += 0.003 * cdfyColour;
  } else if (uv.y > cdfyStart && uv.x > 0.5) {
    colour.r += icdfyColour;
  } else if (uv.y > cdfxStart) {
    colour.r += 0.00003 * cdfxColour;
  } else if (uv.y > icdfxStart) {
    colour.r += icdfxColour;
  }
  gl_FragColor = vec4(colour, 1.0);
  glFragColor.rgb = mix(gl_FragColor.rgb, backgroundColour, 0.5);
}
