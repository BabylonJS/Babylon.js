flat varying highp int vBatch;
flat varying highp uint vMask;

uniform vec3 tileMaskResolution;

void main(void) {
    // Ensure the pixel we're writing to is of the correct batch
    int coordBatch = int(gl_FragCoord.y / tileMaskResolution.y);
    if (coordBatch != vBatch) {
        discard;
    }

    gl_FragColor = vec4(vMask, 0, 0, 1);
}
