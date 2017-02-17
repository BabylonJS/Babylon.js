varying vec2 vPosition;
varying vec2 vUV;

uniform sampler2D dirtSampler;
uniform sampler2D grassSampler;
uniform float dirtAmplifier;

float rand(vec2 n) {
	return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n);
	vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float fbm(vec2 n) {
	float total = 0.0, amplitude = 0.5;
	for (int i = 0; i < 4; i++) {
		total += noise(n) * amplitude;
		n += n;
		amplitude *= 0.5;
	}
	return total;
}

void main(void) {
	vec3 color = mix(texture2D(dirtSampler, vUV).xyz, texture2D(grassSampler, vUV).xyz, fbm(vUV * dirtAmplifier));
	gl_FragColor = vec4(color, 1.0);
}