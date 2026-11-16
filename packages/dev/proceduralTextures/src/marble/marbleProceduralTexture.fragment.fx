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

#ifdef GL_FRAGMENT_PRECISION_HIGH
// Integer hash over [0, 4001), evaluated in highp even when the default precision is mediump. 4001 is prime, so the
// lattice repeats only every 4001 cells, also along the power-of-two coordinate scales these textures use.
// mod4001 skips the range correction: its result is congruent to x and within a few units of [0, 4001), so every
// intermediate stays an integer below 2^24. That is exact in float32 on every GPU, with or without FMA contraction,
// and however 1 / 4001 rounds. The residue is made canonical once, at the end.
// x -> x^3 is a permutation because 4001 = 2 (mod 3). The coordinates re-enter at different offsets and the x * y
// term breaks the point symmetry of the cube. Offsets are chosen so cube arguments stay within (-4096, 4096).
highp float mod4001(highp float x) {
	return x - floor(x * (1.0 / 4001.0)) * 4001.0;
}

highp float cube4001(highp float x) {
	return mod4001(mod4001(x * x) * x);
}

float rand(highp vec2 n) {
	highp float x = mod4001(floor(n.x));
	highp float y = mod4001(floor(n.y));
	highp float h = cube4001(cube4001(x + 37.0) + y + (61.0 - 4001.0));
	h = cube4001(mod4001(h + x * y + 13.0));
	h += h < 0.0 ? 4001.0 : 0.0;
	h -= h >= 4001.0 ? 4001.0 : 0.0;
	return h * (1.0 / 4001.0);
}
#else
// Without highp the exact hash would overflow, so devices that lack it keep the original hash.
float rand(vec2 n) {
	return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
#endif
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