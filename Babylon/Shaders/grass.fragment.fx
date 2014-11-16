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

	float herbwidth = 8.0;

	vec3 dirt = vec3(0.32, 0.17, 0.09);
	vec3 herb = vec3(0.0, 0.39, 0.09);
	vec3 ground = dirt;

	herbwidth = floor(herbwidth - noise(vUV * 8.0 ));

	float ratioy = mod(floor(gl_FragCoord.y), herbwidth);
	float ratiox = mod(floor(gl_FragCoord.x), herbwidth);

	/*herb = herb * ratiox;
	dirt = dirt * ratioy;*/

	if (ratioy >= 0.0 && ratioy < herbwidth / fbm(vUV * 2.0))
		ground = herb;

	if (ratiox >= 0.0 && ratiox < herbwidth / 2.0)
		ground = herb;

	gl_FragColor = vec4(ground, 1.0);
}