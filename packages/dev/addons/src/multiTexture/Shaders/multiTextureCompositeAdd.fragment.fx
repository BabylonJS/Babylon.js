uniform highp sampler2DArray uLayers;
uniform int uLayerCount;

varying vec2 vUV;

void main() {
    vec4 result = vec4(0.0);
    for (int i = 0; i < MULTITEXTURE_MAXLAYERS; ++i) {
        if (i >= uLayerCount) break;
        vec4 s = texture(uLayers, vec3(vUV, float(i)));
        result = min(result + s, vec4(1.0));
    }
    gl_FragColor = result;
}
