// from https://www.shadertoy.com/view/Mlt3z8

// Generates the basic 2x2 Bayer permutation matrix:
//  [1 2]
//  [3 0]
// Expects _P in [0,1]
fn bayerDither2(_P: vec2f) -> f32 {
    return ((2.0 * _P.y + _P.x + 1.0)%(4.0));
}

// Generates the 4x4 matrix
// Expects _P any pixel coordinate
fn bayerDither4(_P: vec2f) -> f32 {
    var P1: vec2f = ((_P)%(2.0));              // (P >> 0) & 1
    var P2: vec2f = floor(0.5 * ((_P)%(4.0))); // (P >> 1) & 1
    return 4.0 * bayerDither2(P1) + bayerDither2(P2);
}

// Generates the 8x8 matrix
fn bayerDither8(_P: vec2f) -> f32 {
    var P1: vec2f = ((_P)%(2.0));	              // (P >> 0) & 1
    var P2: vec2f = floor(0.5  * ((_P)%(4.0))); // (P >> 1) & 1
    var P4: vec2f = floor(0.25 * ((_P)%(8.0))); // (P >> 2) & 1
    return 4.0 * (4.0 * bayerDither2(P1) + bayerDither2(P2)) + bayerDither2(P4);
}
