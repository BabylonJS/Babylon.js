#ifdef GL_ES
precision highp float;
#endif

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


	vec3 gray = vec3(0.53, 0.53, 0.53);

	float ratioy = mod(gl_FragCoord.y * 100.0 , fbm(vUV * 2.0));
		
	gray = gray * ratioy;

	gl_FragColor = vec4(gray, 1.0);
}