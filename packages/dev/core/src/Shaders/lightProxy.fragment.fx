flat varying vec2 vLimits;
flat varying highp uint vMask;

void main(void) {
    // Ensure the pixel is within the limits for the batch
    if (gl_FragCoord.y < vLimits.x || gl_FragCoord.y > vLimits.y) {
        discard;
    }

    gl_FragColor = vec4(vMask, 0, 0, 1);
}
