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
#include<light0FragmentDeclaration>
#include<light1FragmentDeclaration>
#include<light2FragmentDeclaration>
#include<light3FragmentDeclaration>

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

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

#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif

#ifdef REFRACTION
uniform vec4 vRefractionInfos;

#ifdef REFRACTIONMAP_3D
uniform samplerCube refractionCubeSampler;
#else
uniform sampler2D refraction2DSampler;
uniform mat4 refractionMatrix;
#endif

#ifdef REFRACTIONFRESNEL
uniform vec4 refractionLeftColor;
uniform vec4 refractionRightColor;
#endif
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

#include<fogFragmentDeclaration>

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

#include<light0Fragment>
#include<light1Fragment>
#include<light2Fragment>
#include<light3Fragment>

	// Refraction
	vec3 refractionColor = vec3(0., 0., 0.);

#ifdef REFRACTION
	vec3 refractionVector = normalize(refract(-viewDirectionW, normalW, vRefractionInfos.y));
#ifdef REFRACTIONMAP_3D

	refractionVector.y = refractionVector.y * vRefractionInfos.w;

	if (dot(refractionVector, viewDirectionW) < 1.0)
	{
		refractionColor = textureCube(refractionCubeSampler, refractionVector).rgb * vRefractionInfos.x;
	}
#else
	vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));

	vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;

	refractionCoords.y = 1.0 - refractionCoords.y;

	refractionColor = texture2D(refraction2DSampler, refractionCoords).rgb * vRefractionInfos.x;
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

#ifdef REFRACTIONFRESNEL
	float refractionFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, refractionRightColor.a, refractionLeftColor.a);

	refractionColor *= refractionLeftColor.rgb * (1.0 - refractionFresnelTerm) + refractionFresnelTerm * refractionRightColor.rgb;
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
	vec4 color = vec4(clamp(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor + emissiveColor + refractionColor, 0.0, 1.0), alpha);
#else
	vec4 color = vec4(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor + refractionColor, alpha);
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

#include<fogFragment>

	gl_FragColor = color;
}