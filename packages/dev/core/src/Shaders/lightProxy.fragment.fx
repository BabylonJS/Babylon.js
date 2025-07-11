// Input
flat varying highp uint vMask;

void main(void) {
    gl_FragColor = vec4(vMask, 0, 0, 1);
}
