precision highp float;

// Constants
uniform vec3 vEyePosition;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

// Fire
uniform sampler2D distortionSampler;
uniform sampler2D opacitySampler;

varying vec2 vDistortionCoords1;
varying vec2 vDistortionCoords2;
varying vec2 vDistortionCoords3;

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

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

	return clamp(fogCoeff, 0.0, 1.0);
}
#endif

vec4 bx2(vec4 x)
{
   return vec4(2.0) * x - vec4(1.0);
}

void main(void) {
	// Clip plane
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);

	// Alpha
	float alpha = 1.0;

#ifdef DIFFUSE
	// Fire
	const float distortionAmount0  = 0.092;
	const float distortionAmount1  = 0.092;
	const float distortionAmount2  = 0.092;
	
	vec2 heightAttenuation = vec2(0.3, 0.39);
	
	vec4 noise0 = texture2D(distortionSampler, vDistortionCoords1);
	vec4 noise1 = texture2D(distortionSampler, vDistortionCoords2);
	vec4 noise2 = texture2D(distortionSampler, vDistortionCoords3);
	
	vec4 noiseSum = bx2(noise0) * distortionAmount0 + bx2(noise1) * distortionAmount1 + bx2(noise2) * distortionAmount2;
	
	vec4 perturbedBaseCoords = vec4(vDiffuseUV, 0.0, 1.0) + noiseSum * (vDiffuseUV.y * heightAttenuation.x + heightAttenuation.y);
	
	vec4 opacityColor = texture2D(opacitySampler, perturbedBaseCoords.xy);
	
#ifdef ALPHATEST
	if (opacityColor.r < 0.1)
		discard;
#endif
	
	baseColor = texture2D(diffuseSampler, perturbedBaseCoords.xy) * 2.0;
	baseColor *= opacityColor;

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

	// Bump
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

	// Lighting
	vec3 diffuseBase = vec3(1.0, 1.0, 1.0);

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

	// Composition
	vec4 color = vec4(baseColor.rgb, alpha);

#ifdef FOG
	float fog = CalcFogFactor();
	color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;
#endif

	gl_FragColor = color;
}