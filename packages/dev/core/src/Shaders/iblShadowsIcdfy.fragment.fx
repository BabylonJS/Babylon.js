precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D cdfy;

float fetchCDF(int y, int invocationId) {
    return texelFetch(cdfy, ivec2(invocationId, y), 0).x;
}

float bisect(int size, float targetValue, int invocationId)
{
    int a = 0, b = size - 1;
    while (b - a > 1) {
        int c = a + b >> 1;
        if (fetchCDF(c, invocationId) < targetValue)
            a = c;
        else
            b = c;
    }
    return mix(float(a), float(b), (targetValue - fetchCDF(a, invocationId)) / (fetchCDF(b, invocationId) - fetchCDF(a,invocationId))) / float(size - 1);
}

void main(void) {

    ivec2 cdfSize = textureSize(cdfy, 0);
    int cdfHeight = cdfSize.y;
    ivec2 currentPixel = ivec2(gl_FragCoord.xy);

    if (currentPixel.y == 0)
    {
        gl_FragColor = vec4(0.0);
    }
    else if (currentPixel.y == cdfHeight - 2) {
        gl_FragColor = vec4(1.0);
    } else {
        float targetValue = fetchCDF(cdfHeight - 1, currentPixel.x) * vUV.y;
        gl_FragColor = vec4(vec3(bisect(cdfHeight, targetValue, currentPixel.x)), 1.0);
    }
}