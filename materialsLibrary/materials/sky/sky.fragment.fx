precision highp float;

// Input
varying vec3 vPositionW;

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

// Sky
uniform float luminance;
uniform float turbidity;
uniform float rayleigh;
uniform float mieCoefficient;
uniform float mieDirectionalG;
uniform vec3 sunPosition;

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

// Constants
const float e = 2.71828182845904523536028747135266249775724709369995957;
const float pi = 3.141592653589793238462643383279502884197169;
const float n = 1.0003;
const float N = 2.545E25;
const float pn = 0.035;

const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);

const vec3 K = vec3(0.686, 0.678, 0.666);
const float v = 4.0;

const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const vec3 up = vec3(0.0, 1.0, 0.0);

const float EE = 1000.0;
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

const float cutoffAngle = pi/1.95;
const float steepness = 1.5;

vec3 totalRayleigh(vec3 lambda)
{
	return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
}

vec3 simplifiedRayleigh()
{
	return 0.0005 / vec3(94, 40, 18);
}

float rayleighPhase(float cosTheta)
{	 
	return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));
}

vec3 totalMie(vec3 lambda, vec3 K, float T)
{
	float c = (0.2 * T ) * 10E-18;
	return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;
}

float hgPhase(float cosTheta, float g)
{
	return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));
}

float sunIntensity(float zenithAngleCos)
{
	return EE * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos))/steepness)));
}

float A = 0.15;
float B = 0.50;
float C = 0.10;
float D = 0.20;
float E = 0.02;
float F = 0.30;
float W = 1000.0;

vec3 Uncharted2Tonemap(vec3 x)
{
	return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

void main(void) {
	// Clip plane
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif

	/**
	*--------------------------------------------------------------------------------------------------
	* Sky Color
	*--------------------------------------------------------------------------------------------------
	*/
	const vec3 cameraPos = vec3(0.0, 0.0, 0.0);
	float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
	float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
	vec3 sunDirection = normalize(sunPosition);
	float sunE = sunIntensity(dot(sunDirection, up));
	vec3 betaR = simplifiedRayleigh() * rayleighCoefficient;
	vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;
	float zenithAngle = acos(max(0.0, dot(up, normalize(vPositionW - cameraPos))));
	float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	vec3 Fex = exp(-(betaR * sR + betaM * sM));
	float cosTheta = dot(normalize(vPositionW - cameraPos), sunDirection);
	float rPhase = rayleighPhase(cosTheta*0.5+0.5);
	vec3 betaRTheta = betaR * rPhase;
	float mPhase = hgPhase(cosTheta, mieDirectionalG);
	vec3 betaMTheta = betaM * mPhase;
	
	vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));
	Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(1.0 / 2.0)), clamp(pow(1.0-dot(up, sunDirection), 5.0), 0.0, 1.0));

	vec3 direction = normalize(vPositionW - cameraPos);
	float theta = acos(direction.y);
	float phi = atan(direction.z, direction.x);
	vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
	vec3 L0 = vec3(0.1) * Fex;
	
	float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	L0 += (sunE * 19000.0 * Fex) * sundisk;
	
	vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));
	vec3 texColor = (Lin+L0);   
	texColor *= 0.04 ;
	texColor += vec3(0.0,0.001,0.0025)*0.3;

	float g_fMaxLuminance = 1.0;
	float fLumScaled = 0.1 / luminance;     
	float fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled); 

	float ExposureBias = fLumCompressed;

	vec3 curr = Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);
	vec3 skyColor = curr * whiteScale;

	vec3 retColor = pow(skyColor,vec3(1.0/(1.2+(1.2*sunfade))));
	
	vec4 baseColor = vec4(retColor, 1.0);
	/**
	*--------------------------------------------------------------------------------------------------
	* Sky Color
	*--------------------------------------------------------------------------------------------------
	*/
	
	// Alpha
	float alpha = 1.0;

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
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