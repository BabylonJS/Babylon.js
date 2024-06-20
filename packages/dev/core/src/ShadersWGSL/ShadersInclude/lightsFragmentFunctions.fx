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
		var direction: vec3f = lightData.xyz - vPositionW;

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

fn computeSpotLighting(viewDirectionW: vec3f, vNormal: vec3f , lightData: vec4f, lightDirection: vec4f, diffuseColor: vec3f, specularColor: vec3f, range: f32, glossiness: f32) -> lightingInfo {
	var result: lightingInfo;

	var direction: vec3f = lightData.xyz - vPositionW;
	var lightVectorW: vec3f = normalize(direction);
	var attenuation: f32 = max(0., 1.0 - length(direction) / range);

	// diffuse
	var cosAngle: f32 = max(0., dot(lightDirection.xyz, -lightVectorW));

	if (cosAngle >= lightDirection.w)
	{
		cosAngle = max(0., pow(cosAngle, lightData.w));
		attenuation *= cosAngle;

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

fn computeProjectionTextureDiffuseLighting(projectionLightTexture: texture_2d<f32>, projectionLightSampler: sampler, textureProjectionMatrix: mat4x4f) -> vec3f {
	var strq: vec4f = textureProjectionMatrix * vec4f(vPositionW, 1.0);
	strq /= strq.w;
	var textureColor: vec3f = textureSample(projectionLightTexture, projectionLightSampler, strq.xy).rgb;
	return textureColor;
}