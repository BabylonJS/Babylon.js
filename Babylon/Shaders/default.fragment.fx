#ifdef GL_ES
precision mediump float;
#endif

#define MAP_PROJECTION	4.

// Constants
uniform vec3 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec4 vDiffuseColor;
uniform vec4 vSpecularColor;
uniform vec3 vEmissiveColor;
uniform vec4 vMisc;

// Lights
#ifdef LIGHT0
uniform vec4 vLightData0;
uniform vec3 vLightDiffuse0;
uniform vec3 vLightSpecular0;
#ifdef SPOTLIGHT0
uniform vec4 vLightDirection0;
#endif
#ifdef HEMILIGHT0
uniform vec3 vLightGround0;
#endif
#endif

#ifdef LIGHT1
uniform vec4 vLightData1;
uniform vec3 vLightDiffuse1;
uniform vec3 vLightSpecular1;
#ifdef SPOTLIGHT1
uniform vec4 vLightDirection1;
#endif
#ifdef HEMILIGHT1
uniform vec3 vLightGround1;
#endif
#endif

#ifdef LIGHT2
uniform vec4 vLightData2;
uniform vec3 vLightDiffuse2;
uniform vec3 vLightSpecular2;
#ifdef SPOTLIGHT2
uniform vec4 vLightDirection2;
#endif
#ifdef HEMILIGHT2
uniform vec3 vLightGround2;
#endif
#endif

#ifdef LIGHT3
uniform vec4 vLightData3;
uniform vec3 vLightDiffuse3;
uniform vec3 vLightSpecular3;
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

#ifdef REFLECTION
varying vec3 vReflectionUVW;
uniform samplerCube reflectionCubeSampler;
uniform sampler2D reflection2DSampler;
uniform vec2 vReflectionInfos;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform vec2 vEmissiveInfos;
uniform sampler2D emissiveSampler;
#endif

#ifdef SPECULAR
varying vec2 vSpecularUV;
uniform vec2 vSpecularInfos;
uniform sampler2D specularSampler;
#endif

// Input
varying vec3 vPositionW;
varying vec3 vNormalW;

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

// Light Computing
struct lightingInfo
{
	vec3 diffuse;
	vec3 specular;
};

lightingInfo computeLighting(vec3 viewDirectionW, vec4 lightData, vec3 diffuseColor, vec3 specularColor) {
	lightingInfo result;

	vec3 lightVectorW;
	if (lightData.w == 0.)
	{
		lightVectorW = normalize(lightData.xyz - vPositionW);
	}
	else
	{
		lightVectorW = normalize(-lightData.xyz);
	}

	// diffuse
	float ndl = max(0., dot(vNormalW, lightVectorW));

	// Specular
	vec3 angleW = normalize(viewDirectionW + lightVectorW);
	float specComp = max(0., dot(normalize(vNormalW), angleW));
	specComp = pow(specComp, vSpecularColor.a);

	result.diffuse = ndl * diffuseColor;
	result.specular = specComp * specularColor;

	return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor) {
	lightingInfo result;

	vec3 lightVectorW = normalize(lightData.xyz - vPositionW);

	// diffuse
	float cosAngle = max(0., dot(-lightDirection.xyz, lightVectorW));
	float spotAtten = 0.0;

	if (cosAngle >= lightDirection.w)
	{
		cosAngle = max(0., pow(cosAngle, lightData.w));
		spotAtten = (cosAngle - lightDirection.w) / (1. - cosAngle);

		// Diffuse
		float ndl = max(0., dot(vNormalW, -lightDirection.xyz));

		// Specular
		vec3 angleW = normalize(viewDirectionW - lightDirection.xyz);
		float specComp = max(0., dot(normalize(vNormalW), angleW));
		specComp = pow(specComp, vSpecularColor.a);

		result.diffuse = ndl * spotAtten * diffuseColor;
		result.specular = specComp * specularColor * spotAtten;

		return result;
	}

	result.diffuse = vec3(0.);
	result.specular = vec3(0.);

	return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor) {
	lightingInfo result;

	// Diffuse
	float ndl = dot(vNormalW, lightData.xyz) * 0.5 + 0.5;

	// Specular
	vec3 angleW = normalize(viewDirectionW + lightData.xyz);
	float specComp = max(0., dot(normalize(vNormalW), angleW));
	specComp = pow(specComp, vSpecularColor.a);

	result.diffuse = mix(groundColor, diffuseColor, ndl);
	result.specular = specComp * specularColor;

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

#ifdef DIFFUSE
	baseColor = texture2D(diffuseSampler, vDiffuseUV);

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

	baseColor.rgb *= vDiffuseInfos.y;
#endif

	// Ambient color
	vec3 baseAmbientColor = vec3(1., 1., 1.);

#ifdef AMBIENT
	baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
	vec3 specularBase = vec3(0., 0., 0.);

#ifdef LIGHT0
#ifdef SPOTLIGHT0
	lightingInfo info = computeSpotLighting(viewDirectionW, vLightData0, vLightDirection0, vLightDiffuse0, vLightSpecular0);
#endif
#ifdef HEMILIGHT0
	lightingInfo info = computeHemisphericLighting(viewDirectionW, vLightData0, vLightDiffuse0, vLightSpecular0, vLightGround0);
#endif
#ifdef POINTDIRLIGHT0
	lightingInfo info = computeLighting(viewDirectionW, vLightData0, vLightDiffuse0, vLightSpecular0);
#endif
	diffuseBase += info.diffuse;
	specularBase += info.specular;
#endif

#ifdef LIGHT1
#ifdef SPOTLIGHT1
	info = computeSpotLighting(viewDirectionW, vLightData1, vLightDirection1, vLightDiffuse1, vLightSpecular1);
#endif
#ifdef HEMILIGHT1
	info = computeHemisphericLighting(viewDirectionW, vLightData1, vLightDiffuse1, vLightSpecular1, vLightGround1);
#endif
#ifdef POINTDIRLIGHT1
	info = computeLighting(viewDirectionW, vLightData1, vLightDiffuse1, vLightSpecular1);
#endif
	diffuseBase += info.diffuse;
	specularBase += info.specular;
#endif

#ifdef LIGHT2
#ifdef SPOTLIGHT2
	info = computeSpotLighting(viewDirectionW, vLightData2, vLightDirection2, vLightDiffuse2, vLightSpecular2);
#endif
#ifdef HEMILIGHT2
	info = computeHemisphericLighting(viewDirectionW, vLightData2, vLightDiffuse2, vLightSpecular2, vLightGround2);
#endif
#ifdef POINTDIRLIGHT2
	info = computeLighting(viewDirectionW, vLightData2, vLightDiffuse2, vLightSpecular2);
#endif
	diffuseBase += info.diffuse;
	specularBase += info.specular;
#endif

#ifdef LIGHT3
#ifdef SPOTLIGHT3
	info = computeSpotLighting(viewDirectionW, vLightData3, vLightDirection3, vLightDiffuse3, vLightSpecular3);
#endif
#ifdef HEMILIGHT3
	info = computeHemisphericLighting(viewDirectionW, vLightData3, vLightDiffuse3, vLightSpecular3, vLightGround3);
#endif
#ifdef POINTDIRLIGHT3
	info = computeLighting(viewDirectionW, vLightData3, vLightDiffuse3, vLightSpecular3);
#endif
	diffuseBase += info.diffuse;
	specularBase += info.specular;
#endif

	// Reflection
	vec3 reflectionColor = vec3(0., 0., 0.);

#ifdef REFLECTION
	if (vMisc.x != 0.0)
	{
		reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW).rgb * vReflectionInfos.y;
	}
	else
	{
		vec2 coords = vReflectionUVW.xy;

		if (vReflectionInfos.x == MAP_PROJECTION)
		{
			coords /= vReflectionUVW.z;
		}

		coords.y = 1.0 - coords.y;

		reflectionColor = texture2D(reflection2DSampler, coords).rgb * vReflectionInfos.y;
	}
#endif

	// Alpha
	float alpha = vDiffuseColor.a;

#ifdef OPACITY
	vec3 opacityMap = texture2D(opacitySampler, vOpacityUV).rgb * vec3(0.3, 0.59, 0.11);
	alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;
#endif

	// Emissive
	vec3 emissiveColor = vEmissiveColor;
#ifdef EMISSIVE
	emissiveColor += texture2D(emissiveSampler, vEmissiveUV).rgb * vEmissiveInfos.y;
#endif

	// Specular map
	vec3 specularColor = vSpecularColor.rgb;
#ifdef SPECULAR
	specularColor = texture2D(specularSampler, vSpecularUV).rgb * vSpecularInfos.y;
#endif

	// Composition
	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
	vec3 finalSpecular = specularBase * specularColor;

	gl_FragColor = vec4(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor, alpha);
}