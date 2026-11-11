precision highp float;

uniform float time;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;
uniform vec3 c5;
uniform vec3 c6;
uniform vec2 speed;
uniform float shift;
uniform float alphaThreshold;

varying vec2 vUV;

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
	float total = 0.0, amplitude = 1.0;
	for (int i = 0; i < 4; i++) {
		total += noise(n) * amplitude;
		n += n;
		amplitude *= 0.5;
	}
	return total;
}

void main() {
	vec2 p = vUV * 8.0;
	float q = fbm(p - time * 0.1);
	vec2 r = vec2(fbm(p + q + time * speed.x - p.x - p.y), fbm(p + q - time * speed.y));
	vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);
	vec3 color = c * cos(shift * vUV.y);
	float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));

	gl_FragColor = vec4(color, luminance * alphaThreshold + (1.0 - alphaThreshold));
}