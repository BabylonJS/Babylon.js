// Light Computing
struct lightingInfo
{
	vec3 diffuse;
#ifdef SPECULARTERM
	vec3 specular;
#endif
#ifdef NDOTL
	float ndl;
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
#ifdef NDOTL
	result.ndl = ndl;
#endif
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

float getAttenuation(float cosAngle, float exponent) {
	return max(0., pow(cosAngle, exponent));
}

float getIESAttenuation(float cosAngle, sampler2D iesLightSampler) {
	float angle = acos(cosAngle) / PI;
	return texture2D(iesLightSampler, vec2(angle, 0.)).r;
}

lightingInfo basicSpotLighting(vec3 viewDirectionW, vec3 lightVectorW, vec3 vNormal, float attenuation, vec3 diffuseColor, vec3 specularColor, float glossiness) {
	lightingInfo result;	

	// Diffuse
	float ndl = max(0., dot(vNormal, lightVectorW));
#ifdef NDOTL
	result.ndl = ndl;
#endif
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

lightingInfo computeIESSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness, sampler2D iesLightSampler) {	
	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float dotProduct = dot(lightDirection.xyz, -lightVectorW);
	float cosAngle = max(0., dotProduct);

	if (cosAngle >= lightDirection.w)
	{		
		attenuation *= getIESAttenuation(dotProduct, iesLightSampler);
		return basicSpotLighting(viewDirectionW, lightVectorW, vNormal, attenuation, diffuseColor, specularColor, glossiness);
	}

	lightingInfo result;
	result.diffuse = vec3(0.);
#ifdef SPECULARTERM
	result.specular = vec3(0.);
#endif
#ifdef NDOTL
	result.ndl = 0.;
#endif

	return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {
	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float cosAngle = max(0., dot(lightDirection.xyz, -lightVectorW));

	if (cosAngle >= lightDirection.w)
	{		
		attenuation *= getAttenuation(cosAngle, lightData.w);
		return basicSpotLighting(viewDirectionW, lightVectorW, vNormal, attenuation, diffuseColor, specularColor, glossiness);
	}

	lightingInfo result;
	result.diffuse = vec3(0.);
#ifdef SPECULARTERM
	result.specular = vec3(0.);
#endif
#ifdef NDOTL
	result.ndl = 0.;
#endif

	return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float glossiness) {
	lightingInfo result;

	// Diffuse
	float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
#ifdef NDOTL
	result.ndl = ndl;
#endif

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

#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler, mat4 textureProjectionMatrix, vec3 posW){
	vec4 strq = textureProjectionMatrix * vec4(posW, 1.0);
	strq /= strq.w;
	vec3 textureColor = texture2D(projectionLightSampler, strq.xy).rgb;
	return textureColor;
}

#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>

uniform sampler2D areaLightsLTC1Sampler;
uniform sampler2D areaLightsLTC2Sampler;

#define inline
lightingInfo computeAreaLighting(sampler2D ltc1, sampler2D ltc2, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec3 lightPosition, vec3 halfWidth, vec3 halfHeight, vec3 diffuseColor, vec3 specularColor, float roughness) 
{
	lightingInfo result;
	areaLightData data = computeAreaLightSpecularDiffuseFresnel(ltc1, ltc2, viewDirectionW, vNormal, vPosition, lightPosition, halfWidth, halfHeight, roughness);

#ifdef SPECULARTERM
	vec3 fresnel = ( specularColor * data.Fresnel.x + ( vec3( 1.0 ) - specularColor ) * data.Fresnel.y );
	result.specular += specularColor * fresnel * data.Specular;
#endif
	
	result.diffuse += diffuseColor * data.Diffuse;
	return result;
}

// End Area Light
#endif

#if defined(CLUSTLIGHT_MAX) && CLUSTLIGHT_MAX > 0
#define inline
lightingInfo computeClusteredLighting(sampler2D lightMask, vec3 viewDirectionW, vec3 vNormal, vec4 lightData, ClusteredLight lights[CLUSTLIGHT_MAX], vec3 diffuseScale, vec3 specularScale, float glossiness) {
	lightingInfo result;
	vec4 maskTexel = texelFetch(lightMask, ivec2(gl_FragCoord.xy * lightData.xy), 0);
	uint mask = uint(maskTexel.r);
	uint len = uint(lightData.z);

	for (uint i = 0u; i < len; i += 1u) {
		if ((mask & (1u << i)) == 0u) {
			continue;
		}
		vec3 diffuse = lights[i].diffuse.rgb * diffuseScale;
		vec3 specular = lights[i].specular.rgb * specularScale;
		lightingInfo info = computeSpotLighting(viewDirectionW, vNormal, lights[i].position, lights[i].direction, diffuse.rgb, specular, lights[i].diffuse.a, glossiness);
		result.diffuse += info.diffuse;
		#ifdef SPECULARTERM
			result.specular += info.specular;
		#endif
	}
	return result;
}
#endif
