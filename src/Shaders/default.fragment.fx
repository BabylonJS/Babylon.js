#ifdef BUMP
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

// Constants
#define RECIPROCAL_PI2 0.15915494

uniform vec3 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec4 vDiffuseColor;
#ifdef SPECULARTERM
uniform vec4 vSpecularColor;
#endif
uniform vec3 vEmissiveColor;

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
#ifdef SPECULARTERM
uniform vec3 vLightSpecular0;
#endif
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
#ifdef SPECULARTERM
uniform vec3 vLightSpecular1;
#endif
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
#ifdef SPECULARTERM
uniform vec3 vLightSpecular2;
#endif
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
#ifdef SPECULARTERM
uniform vec3 vLightSpecular3;
#endif
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

#ifdef AMBIENT
varying vec2 vAmbientUV;
uniform sampler2D ambientSampler;
uniform vec2 vAmbientInfos;
#endif

#ifdef OPACITY	
varying vec2 vOpacityUV;
uniform sampler2D opacitySampler;
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform vec2 vEmissiveInfos;
uniform sampler2D emissiveSampler;
#endif

#ifdef LIGHTMAP
varying vec2 vLightmapUV;
uniform vec2 vLightmapInfos;
uniform sampler2D lightmapSampler;
#endif

#if defined(SPECULAR) && defined(SPECULARTERM)
varying vec2 vSpecularUV;
uniform vec2 vSpecularInfos;
uniform sampler2D specularSampler;
#endif

// Fresnel
#ifdef FRESNEL
float computeFresnelTerm(vec3 viewDirection, vec3 worldNormal, float bias, float power)
{
	float fresnelTerm = pow(bias + abs(dot(viewDirection, worldNormal)), power);
	return clamp(fresnelTerm, 0., 1.);
}
#endif

#ifdef DIFFUSEFRESNEL
uniform vec4 diffuseLeftColor;
uniform vec4 diffuseRightColor;
#endif

#ifdef OPACITYFRESNEL
uniform vec4 opacityParts;
#endif

#ifdef EMISSIVEFRESNEL
uniform vec4 emissiveLeftColor;
uniform vec4 emissiveRightColor;
#endif

// Reflection
#ifdef REFLECTION
uniform vec2 vReflectionInfos;

#ifdef REFLECTIONMAP_3D
uniform samplerCube reflectionCubeSampler;
#else
uniform sampler2D reflection2DSampler;
#endif

#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
varying vec3 vDirectionW;
#endif

#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)
uniform mat4 reflectionMatrix;
#endif
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION)
uniform mat4 view;
#endif
#endif

vec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)
{
#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
	vec3 direction = normalize(vDirectionW);

	float t = clamp(direction.y * -0.5 + 0.5, 0., 1.0);
	float s = atan(direction.z, direction.x) * RECIPROCAL_PI2 + 0.5;

	return vec3(s, t, 0);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR

	vec3 cameraToVertex = normalize(worldPos.xyz - vEyePosition);
	vec3 r = reflect(cameraToVertex, worldNormal);
	float t = clamp(r.y * -0.5 + 0.5, 0., 1.0);
	float s = atan(r.z, r.x) * RECIPROCAL_PI2 + 0.5;

	return vec3(s, t, 0);
#endif

#ifdef REFLECTIONMAP_SPHERICAL
	vec3 viewDir = normalize(vec3(view * worldPos));
	vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));

	vec3 r = reflect(viewDir, viewNormal);
	r.z = r.z - 1.0;

	float m = 2.0 * length(r);

	return vec3(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);
#endif

#ifdef REFLECTIONMAP_PLANAR
	vec3 viewDir = worldPos.xyz - vEyePosition;
	vec3 coords = normalize(reflect(viewDir, worldNormal));

	return vec3(reflectionMatrix * vec4(coords, 1));
#endif

#ifdef REFLECTIONMAP_CUBIC
	vec3 viewDir = worldPos.xyz - vEyePosition;
	vec3 coords = reflect(viewDir, worldNormal);
#ifdef INVERTCUBICMAP
	coords.y = 1.0 - coords.y;
#endif
	return vec3(reflectionMatrix * vec4(coords, 0));
#endif

#ifdef REFLECTIONMAP_PROJECTION
	return vec3(reflectionMatrix * (view * worldPos));
#endif

#ifdef REFLECTIONMAP_SKYBOX
	return vPositionUVW;
#endif

#ifdef REFLECTIONMAP_EXPLICIT
	return vec3(0, 0, 0);
#endif
}

#ifdef REFLECTIONFRESNEL
uniform vec4 reflectionLeftColor;
uniform vec4 reflectionRightColor;
#endif

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
	depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
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

float computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)
{
	vec3 directionToLight = vPositionW - lightPosition;
	float depth = length(directionToLight);

	depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
	depth = clamp(depth, 0., 1.0);

	directionToLight = normalize(directionToLight);
	directionToLight.y = -directionToLight.y;

	float visibility = 1.;

	vec3 poissonDisk[4];
	poissonDisk[0] = vec3(-1.0, 1.0, -1.0);
	poissonDisk[1] = vec3(1.0, -1.0, -1.0);
	poissonDisk[2] = vec3(-1.0, -1.0, -1.0);
	poissonDisk[3] = vec3(1.0, -1.0, 1.0);

	// Poisson Sampling
	float biasedDepth = depth - bias;

	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;

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

	if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;
	if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;

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

// Bump
#ifdef BUMP
varying vec2 vBumpUV;
uniform vec2 vBumpInfos;
uniform sampler2D bumpSampler;

// Thanks to http://www.thetenthplanet.de/archives/1180
mat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv)
{
	// get edge vectors of the pixel triangle
	vec3 dp1 = dFdx(p);
	vec3 dp2 = dFdy(p);
	vec2 duv1 = dFdx(uv);
	vec2 duv2 = dFdy(uv);

	// solve the linear system
	vec3 dp2perp = cross(dp2, normal);
	vec3 dp1perp = cross(normal, dp1);
	vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;
	vec3 binormal = dp2perp * duv1.y + dp1perp * duv2.y;

	// construct a scale-invariant frame 
	float invmax = inversesqrt(max(dot(tangent, tangent), dot(binormal, binormal)));
	return mat3(tangent * invmax, binormal * invmax, normal);
}

vec3 perturbNormal(vec3 viewDir)
{
	vec3 map = texture2D(bumpSampler, vBumpUV).xyz;
	map = map * 255. / 127. - 128. / 127.;
	mat3 TBN = cotangent_frame(vNormalW * vBumpInfos.y, -viewDir, vBumpUV);
	return normalize(TBN * map);
}
#endif

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;
varying float vFragmentDepth;
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
#ifdef SPECULARTERM
	vec3 specular;
#endif
};

lightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {
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

#ifdef SPECULARTERM
	// Specular
	vec3 angleW = normalize(viewDirectionW + lightVectorW);
	float specComp = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor * attenuation;
#endif
	return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {
	lightingInfo result;

	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float cosAngle = max(0., dot(-lightDirection.xyz, lightVectorW));

	if (cosAngle >= lightDirection.w)
	{
		cosAngle = max(0., pow(cosAngle, lightData.w));
		attenuation *= cosAngle;

		// Diffuse
		float ndl = max(0., dot(vNormal, -lightDirection.xyz));
		result.diffuse = ndl * diffuseColor * attenuation;

#ifdef SPECULARTERM
		// Specular
		vec3 angleW = normalize(viewDirectionW - lightDirection.xyz);
		float specComp = max(0., dot(vNormal, angleW));
		specComp = pow(specComp, max(1., glossiness));

		result.specular = specComp * specularColor * attenuation;
#endif

		return result;
	}

	result.diffuse = vec3(0.);
#ifdef SPECULARTERM
	result.specular = vec3(0.);
#endif

	return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float glossiness) {
	lightingInfo result;

	// Diffuse
	float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
	result.diffuse = mix(groundColor, diffuseColor, ndl);

#ifdef SPECULARTERM
	// Specular
	vec3 angleW = normalize(viewDirectionW + lightData.xyz);
	float specComp = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor;
#endif

	return result;
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
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = vDiffuseColor.a;

#ifdef DIFFUSE
	baseColor = texture2D(diffuseSampler, vDiffuseUV);

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

#ifdef ALPHAFROMDIFFUSE
	alpha *= baseColor.a;
#endif

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


#ifdef BUMP
	normalW = perturbNormal(viewDirectionW);
#endif

	// Ambient color
	vec3 baseAmbientColor = vec3(1., 1., 1.);

#ifdef AMBIENT
	baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;
#endif


	// Specular map
#ifdef SPECULARTERM
	float glossiness = vSpecularColor.a;
	vec3 specularColor = vSpecularColor.rgb;

#ifdef SPECULAR
	vec4 specularMapColor = texture2D(specularSampler, vSpecularUV);
	specularColor = specularMapColor.rgb;
#ifdef GLOSSINESS
	glossiness = glossiness * specularMapColor.a;
#endif
#endif
#else
	float glossiness = 0.;
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif
	float shadow = 1.;

#ifdef LIGHT0
#ifndef SPECULARTERM
	vec3 vLightSpecular0 = vec3(0.0);
#endif
#ifdef SPOTLIGHT0
	lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);
#endif
#ifdef HEMILIGHT0
	lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, glossiness);
#endif
#if defined(POINTLIGHT0) || defined(DIRLIGHT0)
	lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);
#endif
#ifdef SHADOW0
#ifdef SHADOWVSM0
	shadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);
#else
#ifdef SHADOWPCF0
#if defined(POINTLIGHT0)
	shadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);
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
#ifdef SPECULARTERM
	specularBase += info.specular * shadow;
#endif
#endif

#ifdef LIGHT1
#ifndef SPECULARTERM
	vec3 vLightSpecular1 = vec3(0.0);
#endif
#ifdef SPOTLIGHT1
	info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);
#endif
#ifdef HEMILIGHT1
	info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, glossiness);
#endif
#if defined(POINTLIGHT1) || defined(DIRLIGHT1)
	info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);
#endif
#ifdef SHADOW1
#ifdef SHADOWVSM1
	shadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);
#else
#ifdef SHADOWPCF1
#if defined(POINTLIGHT1)
	shadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);
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
#ifdef SPECULARTERM
	specularBase += info.specular * shadow;
#endif
#endif

#ifdef LIGHT2
#ifndef SPECULARTERM
	vec3 vLightSpecular2 = vec3(0.0);
#endif
#ifdef SPOTLIGHT2
	info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);
#endif
#ifdef HEMILIGHT2
	info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, glossiness);
#endif
#if defined(POINTLIGHT2) || defined(DIRLIGHT2)
	info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);
#endif
#ifdef SHADOW2
#ifdef SHADOWVSM2
	shadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);
#else
#ifdef SHADOWPCF2
#if defined(POINTLIGHT2)
	shadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);
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
#ifdef SPECULARTERM
	specularBase += info.specular * shadow;
#endif
#endif

#ifdef LIGHT3
#ifndef SPECULARTERM
	vec3 vLightSpecular3 = vec3(0.0);
#endif
#ifdef SPOTLIGHT3
	info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);
#endif
#ifdef HEMILIGHT3
	info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, glossiness);
#endif
#if defined(POINTLIGHT3) || defined(DIRLIGHT3)
	info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);
#endif
#ifdef SHADOW3
#ifdef SHADOWVSM3
	shadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);
#else
#ifdef SHADOWPCF3
#if defined(POINTLIGHT3)
	shadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);
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
#ifdef SPECULARTERM
	specularBase += info.specular * shadow;
#endif
#endif

	// Reflection
	vec3 reflectionColor = vec3(0., 0., 0.);


#ifdef REFLECTION
	vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);

#ifdef REFLECTIONMAP_3D
#ifdef ROUGHNESS
	 float bias = vReflectionInfos.y;

	#ifdef SPECULARTERM
	#ifdef SPECULAR
	#ifdef GLOSSINESS
		bias *= (1.0 - specularMapColor.a);
	#endif
	#endif
	#endif

	reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW, bias).rgb * vReflectionInfos.x;
#else
	reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW).rgb * vReflectionInfos.x;
#endif

#else
	vec2 coords = vReflectionUVW.xy;

#ifdef REFLECTIONMAP_PROJECTION
	coords /= vReflectionUVW.z;
#endif

	coords.y = 1.0 - coords.y;

	reflectionColor = texture2D(reflection2DSampler, coords).rgb * vReflectionInfos.x;
#endif

#ifdef REFLECTIONFRESNEL
	float reflectionFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, reflectionRightColor.a, reflectionLeftColor.a);

#ifdef REFLECTIONFRESNELFROMSPECULAR
#ifdef SPECULARTERM
	reflectionColor *= specularColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * reflectionRightColor.rgb;
#else
	reflectionColor *= reflectionLeftColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * reflectionRightColor.rgb;
#endif
#else
	reflectionColor *= reflectionLeftColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * reflectionRightColor.rgb;
#endif
#endif
#endif

#ifdef OPACITY
	vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);

#ifdef OPACITYRGB
	opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);
	alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;
#else
	alpha *= opacityMap.a * vOpacityInfos.y;
#endif

#endif

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

#ifdef OPACITYFRESNEL
	float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);

	alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;
#endif

	// Emissive
	vec3 emissiveColor = vEmissiveColor;
#ifdef EMISSIVE
	emissiveColor += texture2D(emissiveSampler, vEmissiveUV).rgb * vEmissiveInfos.y;
#endif

#ifdef EMISSIVEFRESNEL
	float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);

	emissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;
#endif

	// Fresnel
#ifdef DIFFUSEFRESNEL
	float diffuseFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, diffuseRightColor.a, diffuseLeftColor.a);

	diffuseBase *= diffuseLeftColor.rgb * (1.0 - diffuseFresnelTerm) + diffuseFresnelTerm * diffuseRightColor.rgb;
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
#else
#ifdef LINKEMISSIVEWITHDIFFUSE
	vec3 finalDiffuse = clamp((diffuseBase + emissiveColor) * diffuseColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
#else
	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
#endif
#endif

#ifdef SPECULARTERM
	vec3 finalSpecular = specularBase * specularColor;
#else
	vec3 finalSpecular = vec3(0.0);
#endif

#ifdef SPECULAROVERALPHA
	alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	vec4 color = vec4(clamp(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor + emissiveColor, 0.0, 1.0), alpha);
#else
	vec4 color = vec4(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor, alpha);
#endif

#ifdef LIGHTMAP
	vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV).rgb * vLightmapInfos.y;

#ifdef USELIGHTMAPASSHADOWMAP
	color.rgb *= lightmapColor;
#else
	color.rgb += lightmapColor;
#endif
#endif

#ifdef LOGARITHMICDEPTH
	gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
#endif

#ifdef FOG
	float fog = CalcFogFactor();
	color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;
#endif

	gl_FragColor = color;
}