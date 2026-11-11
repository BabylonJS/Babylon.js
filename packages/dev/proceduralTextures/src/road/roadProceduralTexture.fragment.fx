precision highp float;

varying vec2 vUV;                    
uniform vec3 roadColor;

// Arithmetic-only hash: sin/cos of large arguments differ between GPUs, so a trig hash isn't reproducible.
float rand(vec2 n) {
	vec3 p3 = fract(vec3(n.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
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