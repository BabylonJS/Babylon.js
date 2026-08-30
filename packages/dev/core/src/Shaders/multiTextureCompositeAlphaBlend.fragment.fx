uniform highp sampler2DArray uLayers;
uniform int uLayerCount;

varying vec2 vUV;

void main() {
    // Standard source-over accumulation. `result` is a premultiplied accumulator: with straight
    // layers (default) each sample is premultiplied on the fly and the output is un-premultiplied;
    // with premultiplyAlpha: true the layers are stored premultiplied and the output stays so.
    vec4 result = vec4(0.0);
    for (int i = 0; i < MULTITEXTURE_MAXLAYERS; ++i) {
        if (i >= uLayerCount) break;
        vec4 s = texture(uLayers, vec3(vUV, float(i)));
        #ifdef MULTITEXTURE_PREMULTIPLY
        result = s + result * (1.0 - s.a);
        #else
        result.rgb = s.rgb * s.a + result.rgb * (1.0 - s.a);
        result.a = s.a + result.a * (1.0 - s.a);
        #endif
    }
    #ifdef MULTITEXTURE_PREMULTIPLY
    gl_FragColor = result;
    #else
    gl_FragColor = vec4((result.a > 0.0) ? result.rgb / result.a : vec3(0.0), result.a);
    #endif
}
