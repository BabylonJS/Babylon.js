precision highp float;
varying vec2 vPosition;
void main(void) {
    float A = -dot(vPosition, vPosition);
    if (A < -1.) discard;
}