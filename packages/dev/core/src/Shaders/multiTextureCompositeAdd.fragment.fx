uniform highp sampler2DArray uLayers;
uniform int uLayerCount;

varying vec2 vUV;

void main() {
    ivec2 px = min(ivec2(vUV * vec2(float(MULTITEXTURE_WIDTH), float(MULTITEXTURE_HEIGHT))), ivec2(MULTITEXTURE_WIDTH - 1, MULTITEXTURE_HEIGHT - 1));
    vec4 result = vec4(0.0);
    for (int i = 0; i < MULTITEXTURE_MAXLAYERS; ++i) {
        if (i >= uLayerCount) break;
        vec4 s = texelFetch(uLayers, ivec3(px, i), 0);
        result = min(result + s, vec4(1.0));
    }
    gl_FragColor = result;
}
