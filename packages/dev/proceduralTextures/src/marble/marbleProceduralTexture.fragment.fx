precision highp float;

varying vec2 vPosition;
varying vec2 vUV;

uniform float numberOfTilesHeight;
uniform float numberOfTilesWidth;
uniform float amplitude;
uniform vec3 marbleColor;
uniform vec3 jointColor;

const vec3 tileSize = vec3(1.1, 1.0, 1.1);
const vec3 tilePct = vec3(0.98, 1.0, 0.98);

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

float turbulence(vec2 P)
{
	float val = 0.0;
	float freq = 1.0;
	for (int i = 0; i < 4; i++)
	{
		val += abs(noise(P*freq) / freq);
		freq *= 2.07;
	}
	return val;
}

float roundF(float number){
	return sign(number)*floor(abs(number) + 0.5);
}

vec3 marble_color(float x)
{
	vec3 col;
	x = 0.5*(x + 1.);
	x = sqrt(x);             
	x = sqrt(x);
	x = sqrt(x);
	col = vec3(.2 + .75*x);  
	col.b *= 0.95;           
	return col;
}

void main()
{
	float brickW = 1.0 / numberOfTilesWidth;
	float brickH = 1.0 / numberOfTilesHeight;
	float jointWPercentage = 0.01;
	float jointHPercentage = 0.01;
	vec3 color = marbleColor;
	float yi = vUV.y / brickH;
	float nyi = roundF(yi);
	float xi = vUV.x / brickW;

	if (mod(floor(yi), 2.0) == 0.0){
		xi = xi - 0.5;
	}

	float nxi = roundF(xi);
	vec2 brickvUV = vec2((xi - floor(xi)) / brickH, (yi - floor(yi)) / brickW);

	if (yi < nyi + jointHPercentage && yi > nyi - jointHPercentage){
		color = mix(jointColor, vec3(0.37, 0.25, 0.25), (yi - nyi) / jointHPercentage + 0.2);
	}
	else if (xi < nxi + jointWPercentage && xi > nxi - jointWPercentage){
		color = mix(jointColor, vec3(0.44, 0.44, 0.44), (xi - nxi) / jointWPercentage + 0.2);
	}
	else {
		float t = 6.28 * brickvUV.x / (tileSize.x + noise(vec2(vUV)*6.0));
		t += amplitude * turbulence(brickvUV.xy);
		t = sin(t);
		color = marble_color(t);
	}

	gl_FragColor = vec4(color, 0.0);
}