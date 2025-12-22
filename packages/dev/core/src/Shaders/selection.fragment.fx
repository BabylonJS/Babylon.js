#if defined(INSTANCES)
flat varying float vSelectionId;
#else
uniform float selectionId;
#endif
varying float vDepthMetric;

void main(void) {
#if defined(INSTANCES)
    float id = vSelectionId;
#else
    float id = selectionId;
#endif

    gl_FragColor = vec4(id, vDepthMetric, 0.0, 1.0);
}
