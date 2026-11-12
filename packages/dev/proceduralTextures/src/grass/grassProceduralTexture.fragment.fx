precision highp float;

varying vec2 vPosition;
varying vec2 vUV;

uniform vec3 herb1Color;
uniform vec3 herb2Color;
uniform vec3 herb3Color;
uniform vec3 groundColor;

// Integer hash over [0, 251). Each product is reduced before the next, so intermediates stay at or below
// 250 * 250 = 62500: exact in float32 on every GPU, and finite under mediump (half float max is 65504).
// x -> x^3 is a permutation because 251 = 2 (mod 3). The prime modulus avoids the shift symmetry of mod-289
// permutations (P(t + 17) = P(t) + 17). A cube of an affine sum is odd about some point, so a lattice reflection
// would only negate its argument; the coordinates re-enter each round at different offsets, and the x * y term
// breaks what is left of that symmetry.
float mod251(float x) {
	x -= floor(x * (1.0 / 251.0)) * 251.0;
	return x < 0.0 ? x + 251.0 : (x >= 251.0 ? x - 251.0 : x);
}

float cube251(float x) {
	return mod251(mod251(x * x) * x);
}

float rand(vec2 n) {
	float x = mod251(floor(n.x));
	float y = mod251(floor(n.y));
	float h = cube251(mod251(cube251(mod251(cube251(mod251(x + 37.0)) + y + 101.0)) + mod251(x * y) + 59.0));
	return (h + cube251(mod251(h + cube251(mod251(y + 13.0)) + x)) * (1.0 / 251.0)) * (1.0 / 251.0);
}
float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float fbm(vec2 n) {
	float total = 0.0, amplitude = 1.0;
	for (int i = 0; i < 4; i++) {
		total += noise(n) * amplitude;
		n += n;
		amplitude *= 0.5;
	}
	return total;
}


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	vec3 color = mix(groundColor, herb1Color, rand(gl_FragCoord.xy * 4.0));
	color = mix(color, herb2Color, rand(gl_FragCoord.xy * 8.0));
	color = mix(color, herb3Color, rand(gl_FragCoord.xy));
	color = mix(color, herb1Color, fbm(gl_FragCoord.xy * 16.0));
	gl_FragColor = vec4(color, 1.0);

#define CUSTOM_FRAGMENT_MAIN_END
}