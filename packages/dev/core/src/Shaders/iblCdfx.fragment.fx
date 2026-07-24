precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D cdfy;
void main(void) {

    ivec2 cdfyRes = textureSize(cdfy, 0);
    // Derive the column from the (unflipped) vUV varying rather than gl_FragCoord, which
    // Native/bgfx (D3D11) flips for render-to-texture. cdfx width == cdfyRes.x + 1, so
    // int(vUV.x * (cdfyRes.x+1)) == int(gl_FragCoord.x) on WebGL (identical there).
    ivec2 currentPixel = ivec2(int(vUV.x * float(cdfyRes.x + 1)), 0);

    float cdfx = 0.0;
    for (int x = 1; x <= currentPixel.x; x++) {
        cdfx += texelFetch(cdfy, ivec2(x - 1, cdfyRes.y - 1), 0).x;
    }
    gl_FragColor = vec4(vec3(cdfx), 1.0);
}