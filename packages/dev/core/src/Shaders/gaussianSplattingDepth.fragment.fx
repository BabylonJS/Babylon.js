precision highp float;

varying vec2 vPosition;
varying vec4 vColor;

void main(void) {
    float A = -dot(vPosition, vPosition);

#if defined(SM_SOFTTRANSPARENTSHADOW) && SM_SOFTTRANSPARENTSHADOW == 1
    float alpha = exp(A) * vColor.a;
    if (A < -4.) discard;
#else
    if (A < -1.) discard;
#endif
}