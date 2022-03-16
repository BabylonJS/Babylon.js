// from https://www.shadertoy.com/view/Mlt3z8

// Generates the basic 2x2 Bayer permutation matrix:
//  [1 2]
//  [3 0]
// Expects _P in [0,1]
float bayerDither2(vec2 _P) {
    return mod(2.0 * _P.y + _P.x + 1.0, 4.0);
}

// Generates the 4x4 matrix
// Expects _P any pixel coordinate
float bayerDither4(vec2 _P) {
    vec2 P1 = mod(_P, 2.0);              // (P >> 0) & 1
    vec2 P2 = floor(0.5 * mod(_P, 4.0)); // (P >> 1) & 1
    return 4.0 * bayerDither2(P1) + bayerDither2(P2);
}

// Generates the 8x8 matrix
float bayerDither8(vec2 _P) {
    vec2 P1 = mod(_P, 2.0);	              // (P >> 0) & 1
    vec2 P2 = floor(0.5  * mod(_P, 4.0)); // (P >> 1) & 1
    vec2 P4 = floor(0.25 * mod(_P, 8.0)); // (P >> 2) & 1
    return 4.0 * (4.0 * bayerDither2(P1) + bayerDither2(P2)) + bayerDither2(P4);
}
