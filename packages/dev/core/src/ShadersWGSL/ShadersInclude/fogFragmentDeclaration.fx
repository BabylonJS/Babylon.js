#ifdef FOG

#define FOGMODE_NONE    0.
#define FOGMODE_EXP     1.
#define FOGMODE_EXP2    2.
#define FOGMODE_LINEAR  3.
const E = 2.71828;

uniform vFogInfos: vec4f;
uniform vFogColor: vec3f;
varying vFogDistance: vec3f;

fn CalcFogFactor() -> f32
{
	var fogCoeff: f32 = 1.0;
	var fogStart: f32 = uniforms.vFogInfos.y;
	var fogEnd: f32 = uniforms.vFogInfos.z;
	var fogDensity: f32 = uniforms.vFogInfos.w;
	var fogDistance: f32 = length(fragmentInputs.vFogDistance);

	if (FOGMODE_LINEAR == uniforms.vFogInfos.x)
	{
		fogCoeff = (fogEnd - fogDistance) / (fogEnd - fogStart);
	}
	else if (FOGMODE_EXP == uniforms.vFogInfos.x)
	{
		fogCoeff = 1.0 / pow(E, fogDistance * fogDensity);
	}
	else if (FOGMODE_EXP2 == uniforms.vFogInfos.x)
	{
		fogCoeff = 1.0 / pow(E, fogDistance * fogDistance * fogDensity * fogDensity);
	}

	return clamp(fogCoeff, 0.0, 1.0);
}
#endif