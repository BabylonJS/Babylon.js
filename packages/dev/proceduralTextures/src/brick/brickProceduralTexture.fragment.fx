precision highp float;

varying vec2 vPosition;
varying vec2 vUV;

uniform float numberOfBricksHeight;
uniform float numberOfBricksWidth;
uniform vec3 brickColor;
uniform vec3 jointColor;

// Integer hash over [0, 251). Each product is reduced before the next, so intermediates stay at or below
// 250 * 250 = 62500: exact in float32 on every GPU, and finite under mediump (half float max is 65504).
// x -> x^3 is a permutation because 251 = 2 (mod 3). The prime modulus avoids the shift symmetry of mod-289
// permutations (P(t + 17) = P(t) + 17). A cube of an affine sum is odd about some point, so a lattice reflection
// would only negate its argument; the coordinates re-enter each round at different offsets, and the x * y term
// breaks what is left of that symmetry.
float mod251(float x) {
	x -= floor(x * (1.0 / 251.0)) * 251.0;
	return x < 0.0 ? x + 251.0 : (x >= 251.0 ? x - 251.0 : x);
}

float cube251(float x) {
	return mod251(mod251(x * x) * x);
}

float rand(vec2 n) {
	float x = mod251(floor(n.x));
	float y = mod251(floor(n.y));
	float h = cube251(mod251(cube251(mod251(cube251(mod251(x + 37.0)) + y + 101.0)) + mod251(x * y) + 59.0));
	return (h + cube251(mod251(h + cube251(mod251(y + 13.0)) + x)) * (1.0 / 251.0)) * (1.0 / 251.0);
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

float roundF(float number){
	return sign(number)*floor(abs(number) + 0.5);
}


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void)
{
	float brickW = 1.0 / numberOfBricksWidth;
	float brickH = 1.0 / numberOfBricksHeight;
	float jointWPercentage = 0.01;
	float jointHPercentage = 0.05;
	vec3 color = brickColor;
	float yi = vUV.y / brickH;
	float nyi = roundF(yi);
	float xi = vUV.x / brickW;

	if (mod(floor(yi), 2.0) == 0.0){
		xi = xi - 0.5;
	}

	float nxi = roundF(xi);
	vec2 brickvUV = vec2((xi - floor(xi)) / brickH, (yi - floor(yi)) /  brickW);

	if (yi < nyi + jointHPercentage && yi > nyi - jointHPercentage){
		color = mix(jointColor, vec3(0.37, 0.25, 0.25), (yi - nyi) / jointHPercentage + 0.2);
	}
	else if (xi < nxi + jointWPercentage && xi > nxi - jointWPercentage){
		color = mix(jointColor, vec3(0.44, 0.44, 0.44), (xi - nxi) / jointWPercentage + 0.2);
	}
	else {
		float brickColorSwitch = mod(floor(yi) + floor(xi), 3.0);

		if (brickColorSwitch == 0.0)
			color = mix(color, vec3(0.33, 0.33, 0.33), 0.3);
		else if (brickColorSwitch == 2.0)
			color = mix(color, vec3(0.11, 0.11, 0.11), 0.3);
	}

	gl_FragColor = vec4(color, 1.0);
}