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

float computeFallOff(float value, vec2 clipSpace, float frustumEdgeFalloff)
{
	float mask = smoothstep(1.0, 1.0 - frustumEdgeFalloff, dot(clipSpace, clipSpace));
	return mix(1.0, value, mask);
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