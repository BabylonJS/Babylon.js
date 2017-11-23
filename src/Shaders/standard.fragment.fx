uniform sampler2D textureSampler;
varying vec2 vUV;

#if defined(PASS_POST_PROCESS)
void main(void)
{
	vec4 color = texture2D(textureSampler, vUV);
	gl_FragColor = color;
}
#endif

#if defined(DOWN_SAMPLE_X4)
uniform vec2 dsOffsets[16];

void main(void)
{
	vec4 average = vec4(0.0, 0.0, 0.0, 0.0);

	average = texture2D(textureSampler, vUV + dsOffsets[0]);
	average += texture2D(textureSampler, vUV + dsOffsets[1]);
	average += texture2D(textureSampler, vUV + dsOffsets[2]);
	average += texture2D(textureSampler, vUV + dsOffsets[3]);
	average += texture2D(textureSampler, vUV + dsOffsets[4]);
	average += texture2D(textureSampler, vUV + dsOffsets[5]);
	average += texture2D(textureSampler, vUV + dsOffsets[6]);
	average += texture2D(textureSampler, vUV + dsOffsets[7]);
	average += texture2D(textureSampler, vUV + dsOffsets[8]);
	average += texture2D(textureSampler, vUV + dsOffsets[9]);
	average += texture2D(textureSampler, vUV + dsOffsets[10]);
	average += texture2D(textureSampler, vUV + dsOffsets[11]);
	average += texture2D(textureSampler, vUV + dsOffsets[12]);
	average += texture2D(textureSampler, vUV + dsOffsets[13]);
	average += texture2D(textureSampler, vUV + dsOffsets[14]);
	average += texture2D(textureSampler, vUV + dsOffsets[15]);

	average /= 16.0;

	gl_FragColor = average;
}
#endif

#if defined(BRIGHT_PASS)
uniform vec2 dsOffsets[4];
uniform float brightThreshold;

void main(void)
{
	vec4 average = vec4(0.0, 0.0, 0.0, 0.0);

	average = texture2D(textureSampler, vUV + vec2(dsOffsets[0].x, dsOffsets[0].y));
	average += texture2D(textureSampler, vUV + vec2(dsOffsets[1].x, dsOffsets[1].y));
	average += texture2D(textureSampler, vUV + vec2(dsOffsets[2].x, dsOffsets[2].y));
	average += texture2D(textureSampler, vUV + vec2(dsOffsets[3].x, dsOffsets[3].y));

	average *= 0.25;

	float luminance = length(average.rgb);

	if (luminance < brightThreshold) {
		average = vec4(0.0, 0.0, 0.0, 1.0);
	}

	gl_FragColor = average;
}
#endif

#if defined(TEXTURE_ADDER)
uniform sampler2D otherSampler;
uniform sampler2D lensSampler;

uniform float exposure;

void main(void)
{
	vec3 colour = texture2D(textureSampler, vUV).rgb;

	colour *= exposure;

	vec3 X = max(vec3(0.0, 0.0, 0.0), colour - 0.004);
	vec3 retColor = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);

	colour = retColor * retColor;
	colour += colour * texture2D(lensSampler, vUV).rgb;

	vec4 finalColor = vec4(colour.rgb, 1.0) + texture2D(otherSampler, vUV);

	gl_FragColor = finalColor;
}
#endif

#if defined(VLS)
#define PI 3.1415926535897932384626433832795

uniform mat4 shadowViewProjection;
uniform mat4 lightWorld;

uniform vec3 cameraPosition;
uniform vec3 sunDirection;
uniform vec3 sunColor;

uniform vec2 depthValues;

uniform float scatteringCoefficient;
uniform float scatteringPower;

uniform sampler2D shadowMapSampler;
uniform sampler2D positionSampler;

float computeScattering(float lightDotView)
{
	float result = 1.0 - scatteringCoefficient * scatteringCoefficient;
	result /= (4.0 * PI * pow(1.0 + scatteringCoefficient * scatteringCoefficient - (2.0 * scatteringCoefficient) * lightDotView, 1.5));
	return result;
}

void main(void)
{
	// Compute
	vec3 worldPos = texture2D(positionSampler, vUV).rgb;
	vec3 startPosition = cameraPosition;

	vec3 rayVector = worldPos - startPosition;

	float rayLength = length(rayVector);
	vec3 rayDirection = rayVector / rayLength;

	float stepLength = rayLength / NB_STEPS;
	vec3 stepL = rayDirection * stepLength;
	vec3 currentPosition = startPosition;
	vec3 accumFog = vec3(0.0);

	for (int i = 0; i < int(NB_STEPS); i++)
	{
		vec4 worldInShadowCameraSpace = shadowViewProjection * vec4(currentPosition, 1.0);
		float depthMetric =  (worldInShadowCameraSpace.z + depthValues.x) / (depthValues.y);
		float shadowPixelDepth = clamp(depthMetric, 0.0, 1.0);

		worldInShadowCameraSpace.xyz /= worldInShadowCameraSpace.w;
		worldInShadowCameraSpace.xyz = 0.5 * worldInShadowCameraSpace.xyz + vec3(0.5);

		float shadowMapValue = texture2D(shadowMapSampler, worldInShadowCameraSpace.xy).r;
		
		if (shadowMapValue > shadowPixelDepth)
			accumFog += sunColor * computeScattering(dot(rayDirection, sunDirection));
		
		currentPosition += stepL;
	}

	accumFog /= NB_STEPS;

	vec3 color = accumFog * scatteringPower;
	gl_FragColor = vec4(color * exp(color) , 1.0);
}

#endif

#if defined(VLSMERGE)
uniform sampler2D originalSampler;

void main(void)
{
	gl_FragColor = texture2D(originalSampler, vUV) + texture2D(textureSampler, vUV);
}
#endif

#if defined(LUMINANCE)
uniform vec2 lumOffsets[4];

void main()
{
	float average = 0.0;
	vec4 color = vec4(0.0);
	float maximum = -1e20;
	vec3 weight = vec3(0.299, 0.587, 0.114);

	for (int i = 0; i < 4; i++)
	{
		color = texture2D(textureSampler, vUV+ lumOffsets[i]);

		//#ifdef SIMPLE
		float GreyValue = dot(color.rgb, vec3(0.33, 0.33, 0.33));
		//#endif

		#ifdef WEIGHTED_AVERAGE
		float GreyValue = dot(color.rgb, weight);
		#endif

		#ifdef BRIGHTNESS
		float GreyValue = max(color.r, max(color.g, color.b));
		#endif

		#ifdef HSL_COMPONENT
		float GreyValue = 0.5 * (max(color.r, max(color.g, color.b)) + min(color.r, min(color.g, color.b)));
		#endif

		#ifdef MAGNITUDE
		float GreyValue = length(color.rgb);
		#endif

		maximum = max(maximum, GreyValue);
		average += (0.25 * log(1e-5 + GreyValue));
	}

	average = exp(average);

	gl_FragColor = vec4(average, maximum, 0.0, 1.0);
}
#endif

#if defined(LUMINANCE_DOWN_SAMPLE)
uniform vec2 dsOffsets[9];
uniform float halfDestPixelSize;

#ifdef FINAL_DOWN_SAMPLER
vec4 pack(float value) {
	const vec4 bit_shift = vec4(255.0 * 255.0 * 255.0, 255.0 * 255.0, 255.0, 1.0);
	const vec4 bit_mask = vec4(0.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);

	vec4 res = fract(value * bit_shift);
	res -= res.xxyz * bit_mask;

	return res;
}
#endif

void main()
{
	vec4 color = vec4(0.0);
	float average = 0.0;

	for (int i = 0; i < 9; i++)
	{
		color = texture2D(textureSampler, vUV + vec2(halfDestPixelSize, halfDestPixelSize) + dsOffsets[i]);
		average += color.r;
	}

	average /= 9.0;

	#ifdef FINAL_DOWN_SAMPLER
	gl_FragColor = pack(average);
	#else
	gl_FragColor = vec4(average, average, 0.0, 1.0);
	#endif
}
#endif

#if defined(HDR)
uniform sampler2D textureAdderSampler;
uniform float averageLuminance;

void main()
{
	vec4 color = texture2D(textureAdderSampler, vUV);
	vec4 adjustedColor = color / averageLuminance;

	color = adjustedColor;
	color.a = 1.0;

	gl_FragColor = color;
}
#endif

#if defined(LENS_FLARE)
#define GHOSTS 3

uniform sampler2D lensColorSampler;

uniform float strength;
uniform float ghostDispersal;
uniform float haloWidth;

uniform vec2 resolution;
uniform float distortionStrength;

float hash(vec2 p)
{
	float h = dot(p, vec2(127.1, 311.7));
	return -1.0 + 2.0*fract(sin(h)*43758.5453123);
}

float noise(in vec2 p)
{
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f*f*(3.0 - 2.0*f);

	return mix(mix(hash(i + vec2(0.0, 0.0)),
		hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)),
			hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p)
{
	float f = 0.0;
	f += 0.5000 * noise(p); p *= 2.02;
	f += 0.2500 * noise(p); p *= 2.03;
	f += 0.1250 * noise(p); p *= 2.01;
	f += 0.0625 * noise(p); p *= 2.04;
	f /= 0.9375;
	return f;
}

vec3 pattern(vec2 uv)
{
	vec2 p = -1.0 + 2.0 * uv;
	float p2 = dot(p, p);
	float f = fbm(vec2(15.0*p2)) / 2.0;
	float r = 0.2 + 0.6 * sin(12.5*length(uv - vec2(0.5)));
	float g = 0.2 + 0.6 * sin(20.5*length(uv - vec2(0.5)));
	float b = 0.2 + 0.6 * sin(17.2*length(uv - vec2(0.5)));
	return (1.0 - f) * vec3(r, g, b);
}

float luminance(vec3 color)
{
	return dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
}

vec4 textureDistorted(sampler2D tex, vec2 texcoord, vec2 direction, vec3 distortion)
{
	return vec4(
		texture2D(tex, texcoord + direction * distortion.r).r,
		texture2D(tex, texcoord + direction * distortion.g).g,
		texture2D(tex, texcoord + direction * distortion.b).b,
		1.0
	);
}

void main(void)
{
	vec2 uv = -vUV + vec2(1.0);
	vec2 ghostDir = (vec2(0.5) - uv) * ghostDispersal;

	vec2 texelSize = 1.0 / resolution;
	vec3 distortion = vec3(-texelSize.x * distortionStrength, 0.0, texelSize.x * distortionStrength);

	vec4 result = vec4(0.0);
	float ghostIndice = 1.0;

	for (int i = 0; i < GHOSTS; ++i)
	{
		vec2 offset = fract(uv + ghostDir * ghostIndice);
		float weight = length(vec2(0.5) - offset) / length(vec2(0.5));
		weight = pow(1.0 - weight, 10.0);

		result += textureDistorted(textureSampler, offset, normalize(ghostDir), distortion) * weight * strength;

		ghostIndice += 1.0;
	}

	vec2 haloVec = normalize(ghostDir) * haloWidth;

	float weight = length(vec2(0.5) - fract(uv + haloVec)) / length(vec2(0.5));
	weight = pow(1.0 - weight, 10.0);

	result += textureDistorted(textureSampler, fract(uv + haloVec), normalize(ghostDir), distortion) * weight * strength;

	result *= texture2D(lensColorSampler, vec2(length(vec2(0.5) - uv) / length(vec2(0.5))));

	gl_FragColor = result;
}
#endif

#if defined(LENS_FLARE_COMPOSE)
uniform sampler2D otherSampler;
uniform sampler2D lensDirtSampler;
uniform sampler2D lensStarSampler;

uniform mat4 lensStarMatrix;

void main(void)
{
	vec2 lensFlareCoords = (lensStarMatrix * vec4(vUV, 1.0, 1.0)).xy;

	vec4 lensMod = texture2D(lensDirtSampler, vUV);
	lensMod += texture2D(lensStarSampler, vUV/*lensFlareCoords*/);

	vec4 result = texture2D(textureSampler, vUV) * lensMod;

	gl_FragColor = texture2D(otherSampler, vUV) + result;
}
#endif

#if defined(DEPTH_OF_FIELD)
uniform sampler2D otherSampler;
uniform sampler2D depthSampler;

uniform float distance;

void main(void)
{
	vec4 sharp = texture2D(otherSampler, vUV);
	vec4 blur = texture2D(textureSampler, vUV);
	float dist = clamp(texture2D(depthSampler, vUV).r * distance, 0.0, 1.0);
	float factor = 0.0;

	if (dist < 0.05)
		factor = 1.0;
	else if (dist < 0.1)
		factor = 20.0 * (0.1 - dist);
	else if (dist < 0.5)
		factor = 0.0;
	else
		factor = 2.0 * (dist - 0.5);

	factor = clamp(factor, 0.0, 0.90);
	gl_FragColor = mix(sharp, blur, factor);
}
#endif

#if defined(MOTION_BLUR)
uniform mat4 inverseViewProjection;
uniform mat4 prevViewProjection;

uniform vec2 screenSize;

uniform float motionScale;
uniform float motionStrength;

uniform sampler2D depthSampler;

void main(void)
{
	vec2 texelSize = 1.0 / screenSize;
	float depth = texture2D(depthSampler, vUV).r;

	vec4 cpos = vec4(vUV * 2.0 - 1.0, depth, 1.0);
	cpos = cpos * inverseViewProjection;

	vec4 ppos = cpos * prevViewProjection;
	ppos.xyz /= ppos.w;
	ppos.xy = ppos.xy * 0.5 + 0.5;

	vec2 velocity = (ppos.xy - vUV) * motionScale * motionStrength;
	float speed = length(velocity / texelSize);
	int nSamples = int(clamp(speed, 1.0, MAX_MOTION_SAMPLES));

	vec4 result = texture2D(textureSampler, vUV);

	for (int i = 1; i < int(MAX_MOTION_SAMPLES); ++i) {
		if (i >= nSamples)
			break;
		
		vec2 offset1 = vUV + velocity * (float(i) / float(nSamples - 1) - 0.5);
		result += texture2D(textureSampler, offset1);
	}

	gl_FragColor = result / float(nSamples);
}
#endif
