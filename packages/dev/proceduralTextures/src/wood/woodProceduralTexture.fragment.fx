precision highp float;

varying vec2 vPosition;
varying vec2 vUV;

uniform float ampScale;
uniform vec3 woodColor;

#ifdef GL_FRAGMENT_PRECISION_HIGH
// Integer hash over [0, 4001), evaluated in highp even when the default precision is mediump. 4001 is prime, so the
// lattice repeats only every 4001 cells, also along the power-of-two coordinate scales these textures use.
// mod4001 skips the range correction: its result is congruent to x and within a few units of [0, 4001), so every
// intermediate stays an integer below 2^24. That is exact in float32 on every GPU, with or without FMA contraction,
// and however 1 / 4001 rounds. The residue is made canonical once, at the end.
// x -> x^3 is a permutation because 4001 = 2 (mod 3). The coordinates re-enter at different offsets and the x * y
// term breaks the point symmetry of the cube. Offsets are chosen so cube arguments stay within (-4096, 4096).
highp float mod4001(highp float x) {
	return x - floor(x * (1.0 / 4001.0)) * 4001.0;
}

highp float cube4001(highp float x) {
	return mod4001(mod4001(x * x) * x);
}

float rand(highp vec2 n) {
	highp float x = mod4001(floor(n.x));
	highp float y = mod4001(floor(n.y));
	highp float h = cube4001(cube4001(x + 37.0) + y + (61.0 - 4001.0));
	h = cube4001(mod4001(h + x * y + 13.0));
	h += h < 0.0 ? 4001.0 : 0.0;
	h -= h >= 4001.0 ? 4001.0 : 0.0;
	return h * (1.0 / 4001.0);
}
#else
// Without highp the exact hash would overflow, so devices that lack it keep the original hash.
float rand(vec2 n) {
	return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
#endif
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

	float ratioy = mod(vUV.x * ampScale, 2.0 + fbm(vUV * 0.8));
	vec3 wood = woodColor * ratioy;
	gl_FragColor = vec4(wood, 1.0);

#define CUSTOM_FRAGMENT_MAIN_END
}