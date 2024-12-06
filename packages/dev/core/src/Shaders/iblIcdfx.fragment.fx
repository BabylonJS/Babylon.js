precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D cdfx;

float fetchCDF(int x) {
    return texelFetch(cdfx, ivec2(x, 0), 0).x;
}

float bisect(int size, float targetValue)
{
    int a = 0, b = size - 1;
    while (b - a > 1) {
        int c = a + b >> 1;
        if (fetchCDF(c) < targetValue)
            a = c;
        else
            b = c;
    }
    return mix(float(a), float(b), (targetValue - fetchCDF(a)) / (fetchCDF(b) - fetchCDF(a))) / float(size - 1);
}

void main(void) {

    ivec2 cdfSize = textureSize(cdfx, 0);
    int cdfWidth = cdfSize.x;
    int icdfWidth = cdfWidth - 1;
    ivec2 currentPixel = ivec2(gl_FragCoord.xy);

    if (currentPixel.x == 0)
    {
        gl_FragColor = vec4(0.0);
    }
    else if (currentPixel.x == icdfWidth - 1) {
        gl_FragColor = vec4(1.0);
    } else {
        float targetValue = fetchCDF(cdfWidth - 1) * vUV.x;
        gl_FragColor = vec4(vec3(bisect(cdfWidth, targetValue)), 1.0);
    }
}