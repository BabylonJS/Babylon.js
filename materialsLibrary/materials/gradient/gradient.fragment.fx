precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

// Gradient variables
uniform vec4 topColor;
uniform vec4 bottomColor;
uniform float offset;
uniform float smoothness;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Lights
#ifdef LIGHT0
uniform vec4 vLightData0;
uniform vec4 vLightDiffuse0;
#ifdef SHADOW0
#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
varying vec4 vPositionFromLight0;
uniform sampler2D shadowSampler0;
#else
uniform samplerCube shadowSampler0;
#endif
uniform vec3 shadowsInfo0;
#endif
#ifdef SPOTLIGHT0
uniform vec4 vLightDirection0;
#endif
#ifdef HEMILIGHT0
uniform vec3 vLightGround0;
#endif
#endif

#ifdef LIGHT1
uniform vec4 vLightData1;
uniform vec4 vLightDiffuse1;
#ifdef SHADOW1
#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
varying vec4 vPositionFromLight1;
uniform sampler2D shadowSampler1;
#else
uniform samplerCube shadowSampler1;
#endif
uniform vec3 shadowsInfo1;
#endif
#ifdef SPOTLIGHT1
uniform vec4 vLightDirection1;
#endif
#ifdef HEMILIGHT1
uniform vec3 vLightGround1;
#endif
#endif

#ifdef LIGHT2
uniform vec4 vLightData2;
uniform vec4 vLightDiffuse2;
#ifdef SHADOW2
#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
varying vec4 vPositionFromLight2;
uniform sampler2D shadowSampler2;
#else
uniform samplerCube shadowSampler2;
#endif
uniform vec3 shadowsInfo2;
#endif
#ifdef SPOTLIGHT2
uniform vec4 vLightDirection2;
#endif
#ifdef HEMILIGHT2
uniform vec3 vLightGround2;
#endif
#endif

#ifdef LIGHT3
uniform vec4 vLightData3;
uniform vec4 vLightDiffuse3;
#ifdef SHADOW3
#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
varying vec4 vPositionFromLight3;
uniform sampler2D shadowSampler3;
#else
uniform samplerCube shadowSampler3;
#endif
uniform vec3 shadowsInfo3;
#endif
#ifdef SPOTLIGHT3
uniform vec4 vLightDirection3;
#endif
#ifdef HEMILIGHT3
uniform vec3 vLightGround3;
#endif
#endif

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

// Shadows
#ifdef SHADOWS

float unpack(vec4 color)
{
	const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
	return dot(color, bit_shift);
}

#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)
uniform vec2 depthValues;

float computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)
{
	vec3 directionToLight = vPositionW - lightPosition;
	float depth = length(directionToLight);
	
	depth = clamp(depth, 0., 1.0);

	directionToLight = normalize(directionToLight);
	directionToLight.y = - directionToLight.y;

	float shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;

	if (depth > shadow)
	{
		return darkness;
	}
	return 1.0;
}

float computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float bias, float darkness, float mapSize)
{
	vec3 directionToLight = vPositionW - lightPosition;
	float depth = length(directionToLight);

	depth = clamp(depth, 0., 1.0);
	float diskScale = 2.0 / mapSize;

	directionToLight = normalize(directionToLight);
	directionToLight.y = -directionToLight.y;

	float visibility = 1.;

	vec3 poissonDisk[4];
	poissonDisk[0] = vec3(-0.094201624, 0.04, -0.039906216);
	poissonDisk[1] = vec3(0.094558609, -0.04, -0.076890725);
	poissonDisk[2] = vec3(-0.094184101, 0.01, -0.092938870);
	poissonDisk[3] = vec3(0.034495938, -0.01, 0.029387760);

	// Poisson Sampling
	float biasedDepth = depth - bias;

	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0])) < biasedDepth) visibility -= 0.25;
	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1])) < biasedDepth) visibility -= 0.25;
	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2])) < biasedDepth) visibility -= 0.25;
	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3])) < biasedDepth) visibility -= 0.25;

	return  min(1.0, visibility + darkness);
}
#endif

#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)
float computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)
{
	vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
	depth = 0.5 * depth + vec3(0.5);
	vec2 uv = depth.xy;

	if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
	{
		return 1.0;
	}

	float shadow = unpack(texture2D(shadowSampler, uv)) + bias;

	if (depth.z > shadow)
	{
		return darkness;
	}
	return 1.;
}

float computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)
{
	vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
	depth = 0.5 * depth + vec3(0.5);
	vec2 uv = depth.xy;

	if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
	{
		return 1.0;
	}

	float visibility = 1.;

	vec2 poissonDisk[4];
	poissonDisk[0] = vec2(-0.94201624, -0.39906216);
	poissonDisk[1] = vec2(0.94558609, -0.76890725);
	poissonDisk[2] = vec2(-0.094184101, -0.92938870);
	poissonDisk[3] = vec2(0.34495938, 0.29387760);

	// Poisson Sampling
	float biasedDepth = depth.z - bias;

	if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] / mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] / mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] / mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] / mapSize)) < biasedDepth) visibility -= 0.25;

	return  min(1.0, visibility + darkness);
}

// Thanks to http://devmaster.net/
float unpackHalf(vec2 color)
{
	return color.x + (color.y / 255.0);
}

float linstep(float low, float high, float v) {
	return clamp((v - low) / (high - low), 0.0, 1.0);
}

float ChebychevInequality(vec2 moments, float compare, float bias)
{
	float p = smoothstep(compare - bias, compare, moments.x);
	float variance = max(moments.y - moments.x * moments.x, 0.02);
	float d = compare - moments.x;
	float p_max = linstep(0.2, 1.0, variance / (variance + d * d));

	return clamp(max(p, p_max), 0.0, 1.0);
}

float computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)
{
	vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
	depth = 0.5 * depth + vec3(0.5);
	vec2 uv = depth.xy;

	if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)
	{
		return 1.0;
	}

	vec4 texel = texture2D(shadowSampler, uv);

	vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));
	return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);
}
#endif
#endif


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

// Light Computing
struct lightingInfo
{
	vec3 diffuse;
};

lightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, float range) {
	lightingInfo result;

	vec3 lightVectorW;
	float attenuation = 1.0;
	if (lightData.w == 0.)
	{
		vec3 direction = lightData.xyz - vPositionW;

		attenuation = max(0., 1.0 - length(direction) / range);
		lightVectorW = normalize(direction);
	}
	else
	{
		lightVectorW = normalize(-lightData.xyz);
	}

	// diffuse
	float ndl = max(0., dot(vNormal, lightVectorW));
	result.diffuse = ndl * diffuseColor * attenuation;

	return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, float range) {
	lightingInfo result;

	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float cosAngle = max(0., dot(-lightDirection.xyz, lightVectorW));
	float spotAtten = 0.0;

	if (cosAngle >= lightDirection.w)
	{
		cosAngle = max(0., pow(cosAngle, lightData.w));
		spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);

		// Diffuse
		float ndl = max(0., dot(vNormal, -lightDirection.xyz));
		result.diffuse = ndl * spotAtten * diffuseColor * attenuation;

		return result;
	}

	result.diffuse = vec3(0.);

	return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 groundColor) {
	lightingInfo result;

	// Diffuse
	float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
	result.diffuse = mix(groundColor, diffuseColor, ndl);

	return result;
}

void main(void) {
	// Clip plane
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

    float h = normalize(vPositionW).y + offset;
    float mysmoothness = clamp(smoothness, 0.01, max(smoothness, 10.));

    vec4 baseColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), mysmoothness), 0.0));

	// Base color
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = baseColor.a;


#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
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
	vec3 diffuseBase = vec3(0., 0., 0.);
	float shadow = 1.;

#ifdef LIGHT0
#ifdef SPOTLIGHT0
	lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightDiffuse0.a);
#endif
#ifdef HEMILIGHT0
	lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightGround0);
#endif
#if defined(POINTLIGHT0) || defined(DIRLIGHT0)
	lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightDiffuse0.a);
#endif
#ifdef SHADOW0
#ifdef SHADOWVSM0
	shadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);
#else
#ifdef SHADOWPCF0
	#if defined(POINTLIGHT0)
	shadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x, shadowsInfo0.y);
	#else
	shadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);
	#endif
#else
	#if defined(POINTLIGHT0)
	shadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);
	#else
	shadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);
	#endif
#endif
#endif
#else
	shadow = 1.;
#endif
	diffuseBase += info.diffuse * shadow;
#endif

#ifdef LIGHT1
#ifdef SPOTLIGHT1
	info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightDiffuse1.a);
#endif
#ifdef HEMILIGHT1
	info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightGround1.a);
#endif
#if defined(POINTLIGHT1) || defined(DIRLIGHT1)
	info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightDiffuse1.a);
#endif
#ifdef SHADOW1
#ifdef SHADOWVSM1
	shadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);
#else
#ifdef SHADOWPCF1
#if defined(POINTLIGHT1)
	shadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x, shadowsInfo1.y);
#else
	shadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);
#endif
#else
	#if defined(POINTLIGHT1)
	shadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);
	#else
	shadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);
	#endif
#endif
#endif
#else
	shadow = 1.;
#endif
	diffuseBase += info.diffuse * shadow;
#endif

#ifdef LIGHT2
#ifdef SPOTLIGHT2
	info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightDiffuse2.a);
#endif
#ifdef HEMILIGHT2
	info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightGround2);
#endif
#if defined(POINTLIGHT2) || defined(DIRLIGHT2)
	info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightDiffuse2.a);
#endif
#ifdef SHADOW2
#ifdef SHADOWVSM2
	shadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);
#else
#ifdef SHADOWPCF2
#if defined(POINTLIGHT2)
	shadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x, shadowsInfo2.y);
#else
	shadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);
#endif
#else
	#if defined(POINTLIGHT2)
	shadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);
	#else
	shadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);
	#endif
#endif	
#endif	
#else
	shadow = 1.;
#endif
	diffuseBase += info.diffuse * shadow;
#endif

#ifdef LIGHT3
#ifdef SPOTLIGHT3
	info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightDiffuse3.a);
#endif
#ifdef HEMILIGHT3
	info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightGround3);
#endif
#if defined(POINTLIGHT3) || defined(DIRLIGHT3)
	info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightDiffuse3.a);
#endif
#ifdef SHADOW3
#ifdef SHADOWVSM3
		shadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);
#else
#ifdef SHADOWPCF3
#if defined(POINTLIGHT3)
	shadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x, shadowsInfo3.y);
#else
	shadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);
#endif
#else
	#if defined(POINTLIGHT3)
	shadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);
	#else
	shadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);
	#endif
#endif	
#endif	
#else
	shadow = 1.;
#endif
	diffuseBase += info.diffuse * shadow;
#endif

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;

	// Composition
	vec4 color = vec4(finalDiffuse, alpha);

#ifdef FOG
	float fog = CalcFogFactor();
	color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;
#endif

	gl_FragColor = color;
}