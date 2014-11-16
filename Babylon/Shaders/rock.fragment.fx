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


	/*vec3 rock = vec3(0.53, 0.53, 0.53);
	vec3 roll = vec3(0.18, 0.18, 0.18);

	float ratioy = mod(vUV.y * 50.0, fbm(vUV * 8.0));

	rock = rock * ratioy;
	roll = roll * ratioy;

	vec3 stone = mix(rock, roll, 0.5);


	gl_FragColor = vec4(stone, 1.0);*/


	/* voronoi.frag */


	vec2 seeds[16];
	vec3 colors[16];

	colors[0] = vec3(0.53, 0.53, 0.53);
	colors[1] = vec3(0.28, 0.28, 0.28);
	colors[2] = vec3(0.23, 0.23, 0.23);
	colors[3] = vec3(0.38, 0.38, 0.38);
	colors[4] = vec3(0.63, 0.63, 0.63);
	colors[5] = vec3(0.78, 0.78, 0.78);
	colors[6] = vec3(0.93, 0.93, 0.93);
	colors[7] = vec3(0.73, 0.73, 0.73);
	colors[8] = vec3(0.43, 0.43, 0.43);
	colors[9] = vec3(0.11, 0.11, 0.11);
	colors[10] = vec3(0.12, 0.12, 0.12);
	colors[11] = vec3(0.64, 0.64, 0.64);
	colors[12] = vec3(0.79, 0.79, 0.79);
	colors[13] = vec3(0.43, 0.43, 0.43);
	colors[14] = vec3(0.21, 0.21, 0.21);
	colors[15] = vec3(0.37, 0.37, 0.37);

	seeds[0] = vec2(0.1, 0.9);
	seeds[1] = vec2(0.2, 0.8);
	seeds[2] = vec2(0.3, 0.7);
	seeds[3] = vec2(0.4, 0.4);
	seeds[4] = vec2(0.5, 0.5);
	seeds[5] = vec2(0.6, 0.3);
	seeds[6] = vec2(0.7, 0.2);
	seeds[7] = vec2(0.8, 0.3);
	seeds[8] = vec2(0.9, 0.4);
	seeds[9] = vec2(1.0, 0.3);
	seeds[10] = vec2(0.5, 0.4);
	seeds[11] = vec2(0.7, 0.8);
	seeds[12] = vec2(0.5, 0.3);
	seeds[13] = vec2(0.7, 0.7);
	seeds[14] = vec2(0.3, 0.3);
	seeds[15] = vec2(0.7, 0.7);

	float dist = distance(seeds[0], vPosition);
	vec3 color = colors[0];

	float hotpoint = 1.0;
	float current = 1.0;
	for (int i = 1; i < 16; i++) {
		current = distance(seeds[i], vPosition);
		if (current < dist) {
			hotpoint++;
			color = colors[i];
			dist = current;
		}
	}

	if (hotpoint > 3.0)
		color = mix(vec3(0.39, 0.32, 0), color, 1.0 / hotpoint);

	gl_FragColor = vec4(color, 1.0);



}