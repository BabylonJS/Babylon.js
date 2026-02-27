// Light Computing
struct lightingInfo
{
	diffuse: vec3f,
#ifdef SPECULARTERM
	specular: vec3f,
#endif
#ifdef NDOTL
	ndl: f32,
#endif
};

fn computeLighting(viewDirectionW: vec3f, vNormal: vec3f, lightData: vec4f, diffuseColor: vec3f, specularColor: vec3f, range: f32, glossiness: f32) -> lightingInfo {
	var result: lightingInfo;

	var lightVectorW: vec3f;
	var attenuation: f32 = 1.0;
	if (lightData.w == 0.)
	{
		var direction: vec3f = lightData.xyz - fragmentInputs.vPositionW;

		attenuation = max(0., 1.0 - length(direction) / range);
		lightVectorW = normalize(direction);
	}
	else
	{
		lightVectorW = normalize(-lightData.xyz);
	}

	// diffuse
	var ndl: f32 = max(0., dot(vNormal, lightVectorW));
#ifdef NDOTL
	result.ndl = ndl;
#endif
	result.diffuse = ndl * diffuseColor * attenuation;
#ifdef SPECULARTERM
	// Specular
	var angleW: vec3f = normalize(viewDirectionW + lightVectorW);
	var specComp: f32 = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor * attenuation;
#endif
	return result;
}

fn getAttenuation(cosAngle: f32, exponent: f32) -> f32 {
	return max(0., pow(cosAngle, exponent));
}

fn getIESAttenuation(cosAngle: f32, iesLightTexture: texture_2d<f32>, iesLightTextureSampler: sampler) -> f32 {
	var angle = acos(cosAngle) / PI;
	return textureSampleLevel(iesLightTexture, iesLightTextureSampler, vec2f(angle, 0), 0.).r;
}

fn computeBasicSpotLighting(viewDirectionW: vec3f, lightVectorW: vec3f, vNormal: vec3f, attenuation: f32, diffuseColor: vec3f, specularColor: vec3f, glossiness: f32) -> lightingInfo {
	var result: lightingInfo;

	// Diffuse
	var ndl: f32 = max(0., dot(vNormal, lightVectorW));
#ifdef NDOTL
	result.ndl = ndl;
#endif
	result.diffuse = ndl * diffuseColor * attenuation;
#ifdef SPECULARTERM
	// Specular
	var angleW: vec3f = normalize(viewDirectionW + lightVectorW);
	var specComp: f32 = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor * attenuation;
#endif
	return result;
}

fn computeIESSpotLighting(viewDirectionW: vec3f, vNormal: vec3f, lightData: vec4f, lightDirection: vec4f, diffuseColor: vec3f, specularColor: vec3f, range: f32, glossiness: f32, iesLightTexture: texture_2d<f32>, iesLightTextureSampler: sampler) -> lightingInfo {
	var direction: vec3f = lightData.xyz - fragmentInputs.vPositionW;
	var lightVectorW: vec3f = normalize(direction);
	var attenuation: f32 = max(0., 1.0 - length(direction) / range);

	// diffuse
	var dotProduct = dot(lightDirection.xyz, -lightVectorW);
	var cosAngle: f32 = max(0., dotProduct);

	if (cosAngle >= lightDirection.w)
	{
		attenuation *= getIESAttenuation(dotProduct, iesLightTexture, iesLightTextureSampler);
		return computeBasicSpotLighting(viewDirectionW, lightVectorW, vNormal, attenuation, diffuseColor, specularColor, glossiness);
	}

	var result: lightingInfo;

	result.diffuse = vec3f(0.);
#ifdef SPECULARTERM
	result.specular = vec3f(0.);
#endif
#ifdef NDOTL
	result.ndl = 0.;
#endif

	return result;
}

fn computeSpotLighting(viewDirectionW: vec3f, vNormal: vec3f , lightData: vec4f, lightDirection: vec4f, diffuseColor: vec3f, specularColor: vec3f, range: f32, glossiness: f32) -> lightingInfo {
	var direction: vec3f = lightData.xyz - fragmentInputs.vPositionW;
	var lightVectorW: vec3f = normalize(direction);
	var attenuation: f32 = max(0., 1.0 - length(direction) / range);

	// diffuse
	var cosAngle: f32 = max(0., dot(lightDirection.xyz, -lightVectorW));

	if (cosAngle >= lightDirection.w)
	{
		attenuation *= getAttenuation(cosAngle, lightData.w);
		return computeBasicSpotLighting(viewDirectionW, lightVectorW, vNormal, attenuation, diffuseColor, specularColor, glossiness);
	}

	var result: lightingInfo;

	result.diffuse = vec3f(0.);
#ifdef SPECULARTERM
	result.specular = vec3f(0.);
#endif
#ifdef NDOTL
	result.ndl = 0.;
#endif

	return result;
}

fn computeHemisphericLighting(viewDirectionW: vec3f, vNormal: vec3f, lightData: vec4f, diffuseColor: vec3f, specularColor: vec3f, groundColor: vec3f, glossiness: f32) -> lightingInfo {
	var result: lightingInfo;

	// Diffuse
	var ndl: f32 = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
#ifdef NDOTL
	result.ndl = ndl;
#endif

	result.diffuse = mix(groundColor, diffuseColor, ndl);

#ifdef SPECULARTERM
	// Specular
	var angleW: vec3f = normalize(viewDirectionW + lightData.xyz);
	var specComp: f32 = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor;
#endif
		return result;
}

fn computeProjectionTextureDiffuseLighting(projectionLightTexture: texture_2d<f32>, projectionLightSampler: sampler, textureProjectionMatrix: mat4x4f, posW: vec3f) -> vec3f {
	var strq: vec4f = textureProjectionMatrix * vec4f(posW, 1.0);
	strq /= strq.w;
	var textureColor: vec3f = textureSample(projectionLightTexture, projectionLightSampler, strq.xy).rgb;
	return textureColor;
}

#if defined(AREALIGHTUSED) &&  defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>

var areaLightsLTC1SamplerSampler: sampler;
var areaLightsLTC1Sampler: texture_2d<f32>;
var areaLightsLTC2SamplerSampler: sampler;
var areaLightsLTC2Sampler: texture_2d<f32>;

fn computeAreaLighting(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, viewDirectionW: vec3f, vNormal:vec3f, vPosition:vec3f, lightPosition:vec3f, halfWidth:vec3f,  halfHeight:vec3f, diffuseColor:vec3f, specularColor:vec3f, roughness:f32 ) -> lightingInfo
{
	var result: lightingInfo;
	var data: areaLightData = computeAreaLightSpecularDiffuseFresnel(ltc1, ltc1Sampler, ltc2, ltc2Sampler, viewDirectionW, vNormal, vPosition, lightPosition, halfWidth, halfHeight, roughness);
#ifdef SPECULARTERM
	var fresnel:vec3f = ( specularColor * data.Fresnel.x + ( vec3f( 1.0 ) - specularColor ) * data.Fresnel.y );
	result.specular += specularColor * fresnel * data.Specular;
#endif
	result.diffuse += diffuseColor * data.Diffuse;
	return result;
}

fn computeAreaLightingWithTexture(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, emissionTexture: texture_2d<f32>, emissionTextureSampler:sampler, viewDirectionW: vec3f, vNormal:vec3f, vPosition:vec3f, lightPosition:vec3f, halfWidth:vec3f,  halfHeight:vec3f, diffuseColor:vec3f, specularColor:vec3f, roughness:f32 ) -> lightingInfo
{
	var result: lightingInfo;
	var data: areaLightData = computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1, ltc1Sampler, ltc2, ltc2Sampler, emissionTexture, emissionTextureSampler, viewDirectionW, vNormal, vPosition, lightPosition, halfWidth, halfHeight, roughness);

#ifdef SPECULARTERM
	var fresnel: vec3f = ( specularColor * data.Fresnel.x + ( vec3f( 1.0 ) - specularColor ) * data.Fresnel.y );
	result.specular += specularColor * fresnel * data.Specular;
#endif

	result.diffuse += diffuseColor * data.Diffuse;
	return result;
}

// End Area Light
#endif

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
#include<clusteredLightingFunctions>

fn computeClusteredLighting(
	lightDataTexture: texture_2d<f32>,
	tileMaskBuffer: ptr<storage, array<u32>>,
	viewDirectionW: vec3f,
	vNormal: vec3f,
	lightData: vec4f,
	sliceRange: vec2u,
	glossiness: f32
) -> lightingInfo {
	var result: lightingInfo;
	let tilePosition = vec2u(fragmentInputs.position.xy * lightData.xy);
	let maskResolution = vec2u(lightData.zw);
	var tileIndex = (tilePosition.x * maskResolution.x + tilePosition.y) * maskResolution.y;

	let batchRange = sliceRange / CLUSTLIGHT_BATCH;
	var batchOffset = batchRange.x * CLUSTLIGHT_BATCH;
	tileIndex += batchRange.x;

	for (var i = batchRange.x; i <= batchRange.y; i += 1) {
		var mask = tileMaskBuffer[tileIndex];
		tileIndex += 1;
		// Mask out the bits outside the range
		let maskOffset = max(sliceRange.x, batchOffset) - batchOffset; // Be careful with unsigned values
		let maskWidth = min(sliceRange.y - batchOffset + 1, CLUSTLIGHT_BATCH);
		mask = extractBits(mask, maskOffset, maskWidth);

		while mask != 0 {
			let trailing = firstTrailingBit(mask);
			mask ^= 1u << trailing;
			let light = getClusteredLight(lightDataTexture, batchOffset + maskOffset + trailing);

			var info: lightingInfo;
			if light.vLightDirection.w < 0.0 {
				// Assume an angle greater than 180º is a point light
				info = computeLighting(viewDirectionW, vNormal, light.vLightData, light.vLightDiffuse.rgb, light.vLightSpecular.rgb, light.vLightDiffuse.a, glossiness);
			} else {
				info = computeSpotLighting(viewDirectionW, vNormal, light.vLightData, light.vLightDirection, light.vLightDiffuse.rgb, light.vLightSpecular.rgb, light.vLightDiffuse.a, glossiness);
			}
			result.diffuse += info.diffuse;
			#ifdef SPECULARTERM
				result.specular += info.specular;
			#endif
		}
		batchOffset += CLUSTLIGHT_BATCH;
	}
	return result;
}
#endif
