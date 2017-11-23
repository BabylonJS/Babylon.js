const float PI = 3.1415926535897932384626433832795;

const float LinearEncodePowerApprox = 2.2;
const float GammaEncodePowerApprox = 1.0 / LinearEncodePowerApprox;
const vec3 LuminanceEncodeApprox = vec3(0.2126, 0.7152, 0.0722);

mat3 transposeMat3(mat3 inMatrix) {
	vec3 i0 = inMatrix[0];
	vec3 i1 = inMatrix[1];
	vec3 i2 = inMatrix[2];

	mat3 outMatrix = mat3(
		vec3(i0.x, i1.x, i2.x),
		vec3(i0.y, i1.y, i2.y),
		vec3(i0.z, i1.z, i2.z)
		);

	return outMatrix;
}

// https://github.com/glslify/glsl-inverse/blob/master/index.glsl
mat3 inverseMat3(mat3 inMatrix) {
	float a00 = inMatrix[0][0], a01 = inMatrix[0][1], a02 = inMatrix[0][2];
  	float a10 = inMatrix[1][0], a11 = inMatrix[1][1], a12 = inMatrix[1][2];
  	float a20 = inMatrix[2][0], a21 = inMatrix[2][1], a22 = inMatrix[2][2];

  	float b01 = a22 * a11 - a12 * a21;
  	float b11 = -a22 * a10 + a12 * a20;
  	float b21 = a21 * a10 - a11 * a20;

  	float det = a00 * b01 + a01 * b11 + a02 * b21;

  	return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
              b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
              b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

float computeFallOff(float value, vec2 clipSpace, float frustumEdgeFalloff)
{
	float mask = smoothstep(1.0 - frustumEdgeFalloff, 1.0, clamp(dot(clipSpace, clipSpace), 0., 1.));
	return mix(value, 1.0, mask);
}

vec3 applyEaseInOut(vec3 x){
	return x * x * (3.0 - 2.0 * x);
}

vec3 toLinearSpace(vec3 color)
{
	return pow(color, vec3(LinearEncodePowerApprox));
}

vec3 toGammaSpace(vec3 color)
{
    return pow(color, vec3(GammaEncodePowerApprox));
}

float square(float value)
{
    return value * value;
}

float getLuminance(vec3 color)
{
    return clamp(dot(color, LuminanceEncodeApprox), 0., 1.);
}

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float getRand(vec2 seed) {
	return fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 dither(vec2 seed, vec3 color) {
	float rand = getRand(seed);
	color.rgb += mix(-0.5/255.0, 0.5/255.0, rand);
	return color;
}