precision highp float;

varying vec2 vUV;                    
uniform vec3 roadColor;

// Integer permutation hash. Every intermediate is an integer below 2^24, so float32 math (with or
// without FMA) is exact on all GPUs, unlike trig or fract-based hashes.
float mod289(float x) {
	x -= floor(x * (1.0 / 289.0)) * 289.0;
	return x < 0.0 ? x + 289.0 : (x >= 289.0 ? x - 289.0 : x);
}

float permute(float x) {
	return mod289((34.0 * x + 1.0) * x);
}

float rand(vec2 n) {
	float x = mod289(floor(n.x));
	float h = permute(permute(x) + mod289(floor(n.y)));
	return (h * 289.0 + permute(h + x)) * (1.0 / 83521.0);
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

	// Per-texel grain in [0, fbm). mod() of a large value amplifies precision differences between GPUs.
	float ratioy = fbm(vUV * 2.0) * rand(gl_FragCoord.xy);
	vec3 color = roadColor * ratioy;
	gl_FragColor = vec4(color, 1.0);

#define CUSTOM_FRAGMENT_MAIN_END
}