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

void main() {
	vec2 p = vUV * 8.0;
	float q = fbm(p - time * 0.1);
	vec2 r = vec2(fbm(p + q + time * speed.x - p.x - p.y), fbm(p + q - time * speed.y));
	vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);
	vec3 color = c * cos(shift * vUV.y);
	float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));

	gl_FragColor = vec4(color, luminance * alphaThreshold + (1.0 - alphaThreshold));
}