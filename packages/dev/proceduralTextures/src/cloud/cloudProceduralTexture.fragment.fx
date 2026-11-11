precision highp float;

varying vec2 vUV;

uniform vec4 skyColor;
uniform vec4 cloudColor;
uniform float amplitude;
uniform int numOctaves;

// Integer hash over [0, 251). Each product is reduced before the next, so intermediates stay at or below
// 250 * 250 = 62500: exact in float32 on every GPU, and finite under mediump (half float max is 65504).
// x -> x^3 is a permutation because 251 = 2 (mod 3). The prime modulus avoids the shift symmetry of mod-289
// permutations (P(t + 17) = P(t) + 17), and the offsets break the cube's point symmetry.
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
	float h = cube251(mod251(cube251(x) + cube251(mod251(y + 101.0)) + 37.0));
	return (h + cube251(mod251(h + x)) * (1.0 / 251.0)) * (1.0 / 251.0);
}

float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float fbm(vec2 n) {
	float total = 0.0, ampl = amplitude;
#ifdef WEBGL2
	for (int i = 0; i < numOctaves; i++) {
#else
	for (int i = 0; i < 4; i++) {
#endif
		total += noise(n) * ampl;
		n += n;
		ampl *= 0.5;
	}
	return total;
}

void main() {

	vec2 p = vUV * 12.0;
	vec4 c = mix(skyColor, cloudColor, fbm(p));
	gl_FragColor = c;

}

