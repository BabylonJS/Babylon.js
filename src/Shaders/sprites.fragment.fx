precision highp float;

uniform bool alphaTest;

varying vec4 vColor;

// Samplers
varying vec2 vUV;
uniform sampler2D diffuseSampler;

// Fog
#ifdef FOG

#define FOGMODE_NONE    0.
#define FOGMODE_EXP     1.
#define FOGMODE_EXP2    2.
#define FOGMODE_LINEAR  3.
#define E 2.71828

uniform vec4 vFogInfos;
uniform vec3 vFogColor;
varying float fFogDistance;

float CalcFogFactor()
{
	float fogCoeff = 1.0;
	float fogStart = vFogInfos.y;
	float fogEnd = vFogInfos.z;
	float fogDensity = vFogInfos.w;

	if (FOGMODE_LINEAR == vFogInfos.x)
	{
		fogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);
	}
	else if (FOGMODE_EXP == vFogInfos.x)
	{
		fogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);
	}
	else if (FOGMODE_EXP2 == vFogInfos.x)
	{
		fogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);
	}

	return min(1., max(0., fogCoeff));
}
#endif


void main(void) {
	vec4 baseColor = texture2D(diffuseSampler, vUV);

	if (alphaTest) 
	{
		if (baseColor.a < 0.95)
			discard;
	}

	baseColor *= vColor;

#ifdef FOG
	float fog = CalcFogFactor();
	baseColor.rgb = fog * baseColor.rgb + (1.0 - fog) * vFogColor;
#endif

	gl_FragColor = baseColor;
}