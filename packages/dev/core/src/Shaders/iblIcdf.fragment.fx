//
precision highp sampler2D;
#include<helperFunctions>

varying vec2 vUV;

#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform sampler2D scaledLuminanceSampler;
uniform int iblWidth;
uniform int iblHeight;

uniform sampler2D cdfx;
uniform sampler2D cdfy;

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

float fetchCDFx(int x) { return texelFetch(cdfx, ivec2(x, 0), 0).x; }

float bisectx(int size, float targetValue) {
  int a = 0, b = size - 1;
  while (b - a > 1) {
    int c = a + b >> 1;
    if (fetchCDFx(c) < targetValue)
      a = c;
    else
      b = c;
  }
  return mix(float(a), float(b),
             (targetValue - fetchCDFx(a)) / (fetchCDFx(b) - fetchCDFx(a))) /
         float(size - 1);
}

float fetchCDFy(int y, int invocationId) {
  return texelFetch(cdfy, ivec2(invocationId, y), 0).x;
}

float bisecty(int size, float targetValue, int invocationId) {
  int a = 0, b = size - 1;
  while (b - a > 1) {
    int c = a + b >> 1;
    if (fetchCDFy(c, invocationId) < targetValue)
      a = c;
    else
      b = c;
  }
  return mix(float(a), float(b),
             (targetValue - fetchCDFy(a, invocationId)) /
                 (fetchCDFy(b, invocationId) - fetchCDFy(a, invocationId))) /
         float(size - 1);
}

void main(void) {

  ivec2 cdfxSize = textureSize(cdfx, 0);
  int cdfWidth = cdfxSize.x;
  int icdfWidth = cdfWidth - 1;
  ivec2 currentPixel = ivec2(gl_FragCoord.xy);

  // icdfx - stores a mapping from the [0, 1] range to an X offset in the CDF.
  // A random value, r, translates to an offset in the CDF where r% of the 
  // cummulative luminance is below that offset. This way, random values will
  // concentrate in the areas of the IBL with higher luminance.
  vec3 outputColor = vec3(1.0);
  if (currentPixel.x == 0) {
    outputColor.x = 0.0;
  } else if (currentPixel.x == icdfWidth - 1) {
    outputColor.x = 1.0;
  } else {
    float targetValue = fetchCDFx(cdfWidth - 1) * vUV.x;
    outputColor.x = bisectx(cdfWidth, targetValue);
  }

  // icdfy - stores a mapping from the [0, 1] range to a Y offset in the CDF.
  ivec2 cdfySize = textureSize(cdfy, 0);
  int cdfHeight = cdfySize.y;
  if (currentPixel.y == 0) {
    outputColor.y = 0.0;
  } else if (currentPixel.y == cdfHeight - 2) {
    outputColor.y = 1.0;
  } else {
    float targetValue = fetchCDFy(cdfHeight - 1, currentPixel.x) * vUV.y;
    outputColor.y = max(bisecty(cdfHeight, targetValue, currentPixel.x), 0.0);
  }

  // Compute the luminance of the current pixel, normalize it and store it in the blue channel.
  // We sample the highest mip, which represents the average luminance.
  vec2 size = vec2(textureSize(scaledLuminanceSampler, 0));
  float highestMip = floor(log2(size.x));
  float normalization = texture(scaledLuminanceSampler, vUV, highestMip).r;
  float pixelLuminance = fetchLuminance(vUV);
  outputColor.z = pixelLuminance / (2.0 * PI * normalization);

  gl_FragColor = vec4(outputColor, 1.0);
}
