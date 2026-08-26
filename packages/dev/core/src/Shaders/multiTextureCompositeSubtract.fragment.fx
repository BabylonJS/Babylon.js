uniform highp sampler2DArray uLayers;
uniform int uLayerCount;

varying vec2 vUV;

void main() {
    if (uLayerCount <= 0) {
        gl_FragColor = vec4(0.0);
        return;
    }
    vec4 result = texture(uLayers, vec3(vUV, 0.0));
    for (int i = 1; i < MULTITEXTURE_MAXLAYERS; ++i) {
        if (i >= uLayerCount) break;
        vec4 s = texture(uLayers, vec3(vUV, float(i)));
        result = max(result - s, vec4(0.0));
        if (dot(result, vec4(1.0)) == 0.0) break;
    }
    gl_FragColor = result;
}
