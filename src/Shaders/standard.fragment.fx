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

#if defined(GAUSSIAN_BLUR_H) || defined(GAUSSIAN_BLUR_V)
uniform float blurOffsets[9];
uniform float blurWeights[9];

void main(void)
{
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

	for (int i = 0; i < 9; i++) {
#ifdef GAUSSIAN_BLUR_H
		color += (texture2D(textureSampler, vUV + vec2(blurOffsets[i] * 2.0, 0.0)) * blurWeights[i]);
		color += (texture2D(textureSampler, vUV - vec2(blurOffsets[i] * 2.0, 0.0)) * blurWeights[i]);
#else
		color += (texture2D(textureSampler, vUV + vec2(0.0, blurOffsets[i] * 2.0)) * blurWeights[i]);
		color += (texture2D(textureSampler, vUV - vec2(0.0, blurOffsets[i] * 2.0)) * blurWeights[i]);
#endif
	}

	color.a = 1.0;
	gl_FragColor = color;
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

	gl_FragColor = vec4(colour.rgb, 1.0) + texture2D(otherSampler, vUV);
}
#endif

#if defined(LENS_FLARE)
#define GHOSTS 3

uniform sampler2D lensColorSampler;

uniform float strength;
uniform float ghostDispersal;
uniform float haloWidth;

float hash(vec2 p) {
	float h = dot(p, vec2(127.1, 311.7));
	return -1.0 + 2.0*fract(sin(h)*43758.5453123);
}

float noise(in vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f*f*(3.0 - 2.0*f);

	return mix(mix(hash(i + vec2(0.0, 0.0)),
		hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)),
			hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
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

void main(void)
{
	vec2 uv = -vUV + vec2(1.0);
	vec2 ghostDir = (vec2(0.5) - uv) * ghostDispersal;

	vec4 result = vec4(0.0);
	for (int i = 0; i < GHOSTS; ++i)
	{
		vec2 offset = fract(uv + ghostDir * float(i));
		float weight = length(vec2(0.5) - offset) / length(vec2(0.5));
		weight = pow(1.0 - weight, 10.0);
		result += texture2D(textureSampler, offset) * weight;
	}

	float patternWeight = 0.4 * length(vec2(0.5) - uv);
	result = mix(result, result * vec4(pattern(uv), 1.0), 0.6);

	result *= texture2D(lensColorSampler, vec2(length(vec2(0.5) - vUV) / length(vec2(0.5))));

	vec2 haloVec = normalize(ghostDir) * haloWidth;
	float weight = length(vec2(0.5) - fract(uv + haloVec)) / length(vec2(0.5));
	weight = pow(1.0 - weight, 5.0);
	vec4 halo = texture2D(textureSampler, uv + haloVec) * weight;

	gl_FragColor = (result + halo) * strength;
}
#endif

#if defined(LENS_FLARE_SHIFT)
uniform vec2 resolution;
uniform float distortionStrength;

void main(void)
{
	const float dispersion = 0.15;

	vec2 uv = -vUV + vec2(1.0);
	vec2 ghostDir = (vec2(0.5) - vUV);

	vec2 texelSize = 1.0 / resolution;
	vec3 distortion = vec3(-texelSize.x * distortionStrength, 0.0, texelSize.x * distortionStrength);
	vec2 direction = vec2(normalize(ghostDir));

	vec4 rgbShift = vec4(
		texture2D(textureSampler, vUV + direction * distortion.r).r,
		texture2D(textureSampler, vUV + direction * distortion.g).g,
		texture2D(textureSampler, vUV + direction * distortion.b).b,
		1.0
	);

	gl_FragColor = rgbShift;
}
#endif

#if defined(LENS_FLARE_COMPOSE)
uniform sampler2D otherSampler;
uniform sampler2D lensDirtSampler;
uniform sampler2D lensStarSampler;

uniform mat4 viewMatrix;
uniform mat3 scaleBias1;
uniform mat3 scaleBias2;

void main(void)
{
	vec3 camerax = viewMatrix[0].xyz;
	vec3 cameraz = viewMatrix[1].xyz;
	float camRot = dot(camerax, vec3(0.0, 0.0, 1.0)) + dot(cameraz, vec3(0.0, 1.0, 0.0));

	mat3 rotation = mat3(
		cos(camRot), -sin(camRot), 0.0,
		sin(camRot), cos(camRot), 0.0,
		0.0, 0.0, 1.0
	);

	mat3 lensMatrix = scaleBias2 * rotation * scaleBias1;
	vec2 lensFlareCoords = (lensMatrix * vec3(vUV, 1.0)).xy;

	vec4 lensMod = texture2D(lensDirtSampler, vUV);
	lensMod += texture2D(lensStarSampler, lensFlareCoords);

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
