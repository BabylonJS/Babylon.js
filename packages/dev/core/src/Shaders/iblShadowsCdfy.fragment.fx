precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D iblSource;
uniform float iblLod;

float fetchPanoramic(ivec2 Coords, float envmapHeight) {
    return sin(PI * (float(Coords.y) + 0.5) / envmapHeight) * dot(texelFetch(iblSource, Coords, int(iblLod)).rgb, vec3(0.3, 0.6, 0.1));
}

void main(void) {

    // ***** Display all slices as a grid *******
    ivec2 size = textureSize(iblSource, 0);
    ivec2 currentPixel = ivec2(gl_FragCoord.xy);
    
    float cdfy = 0.0;
    for (int y = 1; y <= currentPixel.y; y++) {
        cdfy += fetchPanoramic(ivec2(currentPixel.x, y - 1), float(size.y));
    }
    gl_FragColor = vec4(cdfy, 0.0, 0.0, 1.0);
}