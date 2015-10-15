precision highp float;

varying vec2 vPosition;
varying vec2 vUV;

uniform vec3 herb1Color;
uniform vec3 herb2Color;
uniform vec3 herb3Color;
uniform vec3 groundColor;

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
	vec3 color = mix(groundColor, herb1Color, rand(gl_FragCoord.xy * 4.0));
	color = mix(color, herb2Color, rand(gl_FragCoord.xy * 8.0));
	color = mix(color, herb3Color, rand(gl_FragCoord.xy));
	color = mix(color, herb1Color, fbm(gl_FragCoord.xy * 16.0));
	gl_FragColor = vec4(color, 1.0);
}