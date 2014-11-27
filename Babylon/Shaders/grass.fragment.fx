#ifdef GL_ES
precision highp float;
#endif

varying vec2 vPosition;
varying vec2 vUV;


float rand(vec2 n) {
	return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
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

void main(void) {

	vec3 herb1 = vec3(0.29, 0.38, 0.02);
	vec3 herb2 = vec3(0.36, 0.49, 0.09);
	vec3 herb3 = vec3(0.51, 0.6, 0.28);
	vec3 dirt = vec3(0.6, 0.46, 0.13);

	vec3 ground = vec3(1,1,1);
	
	ground = mix(ground, herb1, rand(gl_FragCoord.xy * 4.0));
	ground = mix(ground, herb2, rand(gl_FragCoord.xy * 8.0));
	ground = mix(ground, herb3, rand(gl_FragCoord.xy));
	ground = mix(ground, herb1, fbm(gl_FragCoord.xy * 16.0));

	gl_FragColor = vec4(ground, 1.0);
}