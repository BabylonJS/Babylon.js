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

		var attenuation: f32 = max(0., 1.0 - length(direction) / range);
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

#ifdef AREALIGHTUSED
#include<ltcHelperFunctions>

var areaLightsLTC1SamplerSampler: sampler;
var areaLightsLTC1Sampler: texture_2d<f32>;
var areaLightsLTC2SamplerSampler: sampler;
var areaLightsLTC2Sampler: texture_2d<f32>;

fn computeAreaLighting(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, viewDirectionW: vec3f, vNormal:vec3f, vPosition:vec3f, lightData:vec4f, halfWidth:vec3f,  halfHeight:vec3f, diffuseColor:vec3f, specularColor:vec3f, roughness:f32 ) -> lightingInfo
{
	var result: lightingInfo;
	var normal:vec3f = vNormal;
	var viewDir:vec3f = viewDirectionW;
	var position:vec3f = vPosition;
	var lightPos:vec3f = lightData.xyz;

	var rectCoords0:vec3f = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	var rectCoords1:vec3f = lightPos - halfWidth - halfHeight;
	var rectCoords2:vec3f = lightPos - halfWidth + halfHeight;
	var rectCoords3:vec3f = lightPos + halfWidth + halfHeight;

	var uv:vec2f = LTCUv( normal, viewDir, roughness );

	var t1:vec4f = textureSample( ltc1, ltc1Sampler, uv );
	var t2:vec4f = textureSample( ltc2, ltc2Sampler, uv );

	var mInv:mat3x3<f32> = mat3x3<f32>(
		vec3f( t1.x, 0, t1.y ),
		vec3f(    0, 1,    0 ),
		vec3f( t1.z, 0, t1.w )
	);

#ifdef SPECULARTERM
	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	var fresnel:vec3f = ( specularColor * t2.x + ( vec3f( 1.0 ) - specularColor ) * t2.y );
	result.specular += specularColor * fresnel * LTCEvaluate( normal, viewDir, position, mInv, rectCoords0, rectCoords1, rectCoords2, rectCoords3 );
#endif
	var mInvEmpty:mat3x3<f32> = mat3x3<f32>(
		vec3f( 1, 0, 0 ),
		vec3f( 0, 1, 0 ),
		vec3f( 0, 0, 1 )
	);

	result.diffuse += diffuseColor * LTCEvaluate( normal, viewDir, position, mInvEmpty, rectCoords0, rectCoords1, rectCoords2, rectCoords3 );
	return result;
}

// End Area Light
#endif