precision highp sampler3D;

varying vec2 vUV;

uniform sampler2D cdfy;
uniform sampler2D icdfy;
uniform sampler2D cdfx;
uniform sampler2D icdfx;
uniform sampler2D iblSource;
uniform sampler2D textureSampler;

#define cdfyVSize 0.4
#define cdfxVSize 0.1
#define cdfyHSize 0.5

uniform vec4 sizeParams;
#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w

void main(void) {

  vec2 uv =
      vec2((offsetX + vUV.x) * widthScale, (offsetY + vUV.y) * heightScale);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor.rgba = texture2D(textureSampler, vUV);
    return;
  }
  const float iblStart = 1.0 - cdfyVSize;
  const float cdfyStart = 1.0 - 2.0 * cdfyVSize;
  const float cdfxStart = 1.0 - 2.0 * cdfyVSize - cdfxVSize;
  const float icdfxStart = 1.0 - 2.0 * cdfyVSize - 2.0 * cdfxVSize;
  // ***** Display all slices as a grid *******
  vec3 colour = vec3(0.0);
  if (uv.y > iblStart) {
    colour += texture2D(iblSource,
                        (uv - vec2(0.0, iblStart)) * vec2(1.0, 1.0 / cdfyVSize))
                  .rgb;
  } else if (uv.y > cdfyStart && uv.x < 0.5) {
    colour.r += 0.003 * texture2D(cdfy, (uv - vec2(0.0, cdfyStart)) *
                                            vec2(2.0, 1.0 / cdfyVSize))
                            .r;
  } else if (uv.y > cdfyStart && uv.x > 0.5) {
    colour.r += texture2D(icdfy, (uv - vec2(0.5, cdfyStart)) *
                                     vec2(2.0, 1.0 / cdfyVSize))
                    .r;
  } else if (uv.y > cdfxStart) {
    colour.r += 0.00003 * texture2D(cdfx, (uv - vec2(0.0, cdfxStart)) *
                                              vec2(1.0, 1.0 / cdfxVSize))
                              .r;
  } else if (uv.y > icdfxStart) {
    colour.r += texture2D(icdfx, (uv - vec2(0.0, icdfxStart)) *
                                     vec2(1.0, 1.0 / cdfxVSize))
                    .r;
  }
  gl_FragColor = vec4(colour, 1.0);
  glFragColor.rgb =
      mix(gl_FragColor.rgb, texture(textureSampler, vUV.xy).rgb, 0.5);
}