//
precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D cdfx;
uniform sampler2D cdfy;

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

  vec3 outputColor = vec3(1.0);
  if (currentPixel.x == 0) {
    outputColor.x = 0.0;
  } else if (currentPixel.x == icdfWidth - 1) {
    outputColor.x = 1.0;
  } else {
    float targetValue = fetchCDFx(cdfWidth - 1) * vUV.x;
    outputColor.x = bisectx(cdfWidth, targetValue);
  }
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
  gl_FragColor = vec4(outputColor, 1.0);
}
