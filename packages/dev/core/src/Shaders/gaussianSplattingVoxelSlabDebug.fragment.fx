precision highp float;

varying vec3 vNormalizedPosition;
varying float vAlpha;
varying vec2 vPatchPosition;

uniform float stepSize;

void main(void) {
    float A = -dot(vPatchPosition, vPatchPosition);
    if (A < -vAlpha) discard;
    vec3 normPos = vNormalizedPosition.xyz;

    float chunkSize = stepSize * float(MAX_DRAW_BUFFERS);
    float numChunks = 1.0 / chunkSize;
    float positionInChunk = fract(normPos.z / chunkSize);
    float slab = floor(positionInChunk * float(MAX_DRAW_BUFFERS)) /
                float(MAX_DRAW_BUFFERS);
    if (normPos.x < 0.0 || normPos.y < 0.0 || normPos.z < 0.0 ||
        normPos.x > 1.0 || normPos.y > 1.0 || normPos.z > 1.0) {
        discard;
    } else {
        gl_FragColor = vec4(slab, 0.0, 0.0, 1.0);
    }
}