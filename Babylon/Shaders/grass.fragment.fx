#ifdef GL_ES
precision highp float;
#endif

varying vec2 vPosition;              
varying vec2 vUV;                    

uniform float ampScale;
uniform float ringScale;
uniform vec3 woodColor1;
uniform vec3 woodColor2;


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

	float amplifier = 100.0;

	vec3 dirt = vec3(0.47, 0.27, 0.09);
	vec3 herb = vec3(0.0, 0.39, 0.09);

	float ratioy = mod(vUV.y * amplifier, 2.0 + fbm(vPosition * 2.0));
	float ratiox = mod(vUV.x * amplifier, 2.0 + fbm(vUV * 2.0));
		
	dirt = dirt * ratioy;
	herb = herb * ratiox;
	vec3 ground = mix(dirt, herb, fbm(vUV * 2.0));

	gl_FragColor = vec4(ground, 1.0);
}