#if defined(BUMP)|| !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LODBASEDMICROSFURACE
#extension GL_EXT_shader_texture_lod : enable
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

#include<__decl__legacyPbrFragment>

uniform vec3 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec4 vCameraInfos;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

// Samplers
#ifdef ALBEDO
varying vec2 vAlbedoUV;
uniform sampler2D albedoSampler;
#endif

#ifdef AMBIENT
varying vec2 vAmbientUV;
uniform sampler2D ambientSampler;
#endif

#ifdef OPACITY	
varying vec2 vOpacityUV;
uniform sampler2D opacitySampler;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform sampler2D emissiveSampler;
#endif

#ifdef LIGHTMAP
varying vec2 vLightmapUV;
uniform sampler2D lightmapSampler;
#endif

#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) 
varying vec2 vReflectivityUV;
uniform sampler2D reflectivitySampler;
#endif

#ifdef MICROSURFACEMAP
varying vec2 vMicroSurfaceSamplerUV;
uniform sampler2D microSurfaceSampler;
#endif

// Fresnel
#include<fresnelFunction>

// Refraction
#ifdef REFRACTION


#ifdef REFRACTIONMAP_3D
uniform samplerCube refractionCubeSampler;
#else
uniform sampler2D refraction2DSampler;
#endif
#endif

// Reflection
#ifdef REFLECTION

#ifdef REFLECTIONMAP_3D
uniform samplerCube reflectionCubeSampler;
#else
uniform sampler2D reflection2DSampler;
#endif

#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif

#endif

#include<reflectionFunction>

#endif

#ifdef CAMERACOLORGRADING
	#include<legacyColorGradingDefinition>
#endif

#ifdef CAMERACOLORCURVES
	#include<legacyColorCurvesDefinition>
#endif

// PBR
#include<shadowsFragmentFunctions>
#include<legacyPbrFunctions>

#ifdef CAMERACOLORGRADING
	#include<legacyColorGrading>
#endif

#ifdef CAMERACOLORCURVES
	#include<legacyColorCurves>
#endif

#include<legacyPbrLightFunctions>

#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Bump
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = normalize(cross(dFdx(vPositionW), dFdy(vPositionW)));
#endif

#include<bumpFragment>

#ifdef TWOSIDEDLIGHTING
	normalW = gl_FrontFacing ? normalW : -normalW;
#endif

	// Albedo
	vec4 surfaceAlbedo = vec4(1., 1., 1., 1.);
	vec3 surfaceAlbedoContribution = vAlbedoColor.rgb;

	// Alpha
	float alpha = vAlbedoColor.a;

#ifdef ALBEDO
	surfaceAlbedo = texture2D(albedoSampler, vAlbedoUV + uvOffset);
	surfaceAlbedo = vec4(toLinearSpace(surfaceAlbedo.rgb), surfaceAlbedo.a);

	#ifndef LINKREFRACTIONTOTRANSPARENCY
		#ifdef ALPHATEST
			if (surfaceAlbedo.a < 0.4)
				discard;
		#endif
	#endif

	#ifdef ALPHAFROMALBEDO
		alpha *= surfaceAlbedo.a;
	#endif

	surfaceAlbedo.rgb *= vAlbedoInfos.y;
#else
	// No Albedo texture.
	surfaceAlbedo.rgb = surfaceAlbedoContribution;
	surfaceAlbedoContribution = vec3(1., 1., 1.);
#endif

#ifdef VERTEXCOLOR
	surfaceAlbedo.rgb *= vColor.rgb;
#endif

#ifdef OVERLOADEDVALUES
	surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);
#endif

	// Ambient color
	vec3 ambientOcclusionColor = vec3(1., 1., 1.);

#ifdef AMBIENT
	vec3 ambientOcclusionColorMap = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb * vAmbientInfos.y;
	#ifdef AMBIENTINGRAYSCALE			
		ambientOcclusionColorMap = vec3(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
	#endif
	ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, vAmbientInfos.z);

	#ifdef OVERLOADEDVALUES
		ambientOcclusionColor.rgb = mix(ambientOcclusionColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);
	#endif
#endif

	// Reflectivity map
	float microSurface = vReflectivityColor.a;
	vec3 surfaceReflectivityColor = vReflectivityColor.rgb;

#ifdef REFLECTIVITY
	vec4 surfaceReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);
	surfaceReflectivityColor = surfaceReflectivityColorMap.rgb;
	surfaceReflectivityColor = toLinearSpace(surfaceReflectivityColor);
	surfaceReflectivityColor *= vReflectivityInfos.y;

	#ifdef OVERLOADEDVALUES
		surfaceReflectivityColor = mix(surfaceReflectivityColor, vOverloadedReflectivity, vOverloadedIntensity.z);
	#endif

	#ifdef MICROSURFACEFROMREFLECTIVITYMAP
		microSurface = surfaceReflectivityColorMap.a * vReflectivityInfos.z;
	#else
		#ifdef MICROSURFACEAUTOMATIC
			microSurface = computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);
		#endif
	#endif
#else
	#ifdef OVERLOADEDVALUES
		surfaceReflectivityColor = mix(surfaceReflectivityColor, vOverloadedReflectivity, vOverloadedIntensity.z);
	#endif
#endif

#ifdef METALLICWORKFLOW
	vec2 metallicRoughness = surfaceReflectivityColor.rg;

	#ifdef METALLICMAP
		vec4 surfaceMetallicColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);

		#ifdef AOSTOREINMETALMAPRED			
			vec3 aoStoreInMetalMap = vec3(surfaceMetallicColorMap.r, surfaceMetallicColorMap.r, surfaceMetallicColorMap.r);
			ambientOcclusionColor = mix(ambientOcclusionColor, aoStoreInMetalMap, vReflectivityInfos.z);
		#endif

		#ifdef METALLNESSSTOREINMETALMAPBLUE
			metallicRoughness.r *= surfaceMetallicColorMap.b;
		#else
			metallicRoughness.r *= surfaceMetallicColorMap.r;
		#endif

		#ifdef ROUGHNESSSTOREINMETALMAPALPHA
			metallicRoughness.g *= surfaceMetallicColorMap.a;
		#else
			#ifdef ROUGHNESSSTOREINMETALMAPGREEN
				metallicRoughness.g *= surfaceMetallicColorMap.g;
			#endif
		#endif
	#endif

	#ifdef MICROSURFACEMAP
		vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
		metallicRoughness.g *= microSurfaceTexel.r;
	#endif

	// Compute microsurface form roughness.
	microSurface = 1.0 - metallicRoughness.g;

	// Diffuse is used as the base of the reflectivity.
	vec3 baseColor = surfaceAlbedo.rgb;

	// Default specular reflectance at normal incidence.
	// 4% corresponds to index of refraction (IOR) of 1.50, approximately equal to glass.
	const vec3 DefaultSpecularReflectanceDielectric = vec3(0.04, 0.04, 0.04);

	// Compute the converted diffuse.
	surfaceAlbedo.rgb = mix(baseColor.rgb * (1.0 - DefaultSpecularReflectanceDielectric.r), vec3(0., 0., 0.), metallicRoughness.r);

	// Compute the converted reflectivity.
	surfaceReflectivityColor = mix(DefaultSpecularReflectanceDielectric, baseColor, metallicRoughness.r);

	#ifdef OVERLOADEDVALUES
		surfaceReflectivityColor = mix(surfaceReflectivityColor, vOverloadedReflectivity, vOverloadedIntensity.z);
	#endif
#else
	#ifdef MICROSURFACEMAP
		vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
		microSurface = microSurfaceTexel.r;
	#endif
#endif

#ifdef OVERLOADEDVALUES
	microSurface = mix(microSurface, vOverloadedMicroSurface.x, vOverloadedMicroSurface.y);
#endif

	// Compute N dot V.
	float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));

	// Adapt microSurface.
	microSurface = clamp(microSurface, 0., 1.) * 0.98;

	// Compute roughness.
	float roughness = clamp(1. - microSurface, 0.000001, 1.0);

	// Lighting
	vec3 lightDiffuseContribution = vec3(0., 0., 0.);

#ifdef OVERLOADEDSHADOWVALUES
	vec3 shadowedOnlyLightDiffuseContribution = vec3(1., 1., 1.);
#endif

#ifdef SPECULARTERM
	vec3 lightSpecularContribution = vec3(0., 0., 0.);
#endif
	
	float notShadowLevel = 1.; // 1 - shadowLevel

	#ifdef LIGHTMAP
  		vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset).rgb * vLightmapInfos.y;
  	#endif

	float NdotL = -1.;
	lightingInfo info;

	// Compute reflectance.
	float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);

	// For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
	vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
	vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

#include<legacyPbrLightFunctionsCall>[0..maxSimultaneousLights]

#ifdef SPECULARTERM
	lightSpecularContribution *= vLightingIntensity.w;
#endif

#ifdef OPACITY
	vec4 opacityMap = texture2D(opacitySampler, vOpacityUV + uvOffset);

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

	// Refraction
	vec3 surfaceRefractionColor = vec3(0., 0., 0.);

	// Go mat -> blurry reflexion according to microSurface
#ifdef LODBASEDMICROSFURACE
	float alphaG = convertRoughnessToAverageSlope(roughness);
#endif

#ifdef REFRACTION
	vec3 refractionVector = refract(-viewDirectionW, normalW, vRefractionInfos.y);

	#ifdef LODBASEDMICROSFURACE
		#ifdef USEPMREMREFRACTION
			float lodRefraction = getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.y, alphaG);
		#else
			float lodRefraction = getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.y, alphaG);
		#endif
	#else
		float biasRefraction = (vMicrosurfaceTextureLods.y + 2.) * (1.0 - microSurface);
	#endif

	#ifdef REFRACTIONMAP_3D
		refractionVector.y = refractionVector.y * vRefractionInfos.w;

		if (dot(refractionVector, viewDirectionW) < 1.0)
		{
		#ifdef LODBASEDMICROSFURACE
			#ifdef USEPMREMREFRACTION
					// Empiric Threshold
					if ((vMicrosurfaceTextureLods.y - lodRefraction) > 4.0)
					{
						// Bend to not reach edges.
						float scaleRefraction = 1. - exp2(lodRefraction) / exp2(vMicrosurfaceTextureLods.y); // CubemapSize is the size of the base mipmap
						float maxRefraction = max(max(abs(refractionVector.x), abs(refractionVector.y)), abs(refractionVector.z));
						if (abs(refractionVector.x) != maxRefraction) refractionVector.x *= scaleRefraction;
						if (abs(refractionVector.y) != maxRefraction) refractionVector.y *= scaleRefraction;
						if (abs(refractionVector.z) != maxRefraction) refractionVector.z *= scaleRefraction;
					}
			#endif

				surfaceRefractionColor = textureCubeLodEXT(refractionCubeSampler, refractionVector, lodRefraction).rgb * vRefractionInfos.x;
		#else
				surfaceRefractionColor = textureCube(refractionCubeSampler, refractionVector, biasRefraction).rgb * vRefractionInfos.x;
		#endif
		}

		#ifndef REFRACTIONMAPINLINEARSPACE
			surfaceRefractionColor = toLinearSpace(surfaceRefractionColor.rgb);
		#endif
	#else
		vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));

		vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;

		refractionCoords.y = 1.0 - refractionCoords.y;

		#ifdef LODBASEDMICROSFURACE
			surfaceRefractionColor = texture2DLodEXT(refraction2DSampler, refractionCoords, lodRefraction).rgb * vRefractionInfos.x;
		#else
			surfaceRefractionColor = texture2D(refraction2DSampler, refractionCoords, biasRefraction).rgb * vRefractionInfos.x;
		#endif    

		surfaceRefractionColor = toLinearSpace(surfaceRefractionColor.rgb);
	#endif
#endif

	// Reflection
	vec3 environmentRadiance = vReflectionColor.rgb;
	vec3 environmentIrradiance = vReflectionColor.rgb;

#ifdef REFLECTION
	vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);

	#ifdef LODBASEDMICROSFURACE
		#ifdef USEPMREMREFLECTION
			float lodReflection = getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.x, alphaG);
		#else
			float lodReflection = getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.x, alphaG);
		#endif
	#else
		float biasReflection = (vMicrosurfaceTextureLods.x + 2.) * (1.0 - microSurface);
	#endif

	#ifdef REFLECTIONMAP_3D

		#ifdef LODBASEDMICROSFURACE
			#ifdef USEPMREMREFLECTION
				// Empiric Threshold
				if ((vMicrosurfaceTextureLods.y - lodReflection) > 4.0)
				{
					// Bend to not reach edges.
					float scaleReflection = 1. - exp2(lodReflection) / exp2(vMicrosurfaceTextureLods.x); // CubemapSize is the size of the base mipmap
					float maxReflection = max(max(abs(vReflectionUVW.x), abs(vReflectionUVW.y)), abs(vReflectionUVW.z));
					if (abs(vReflectionUVW.x) != maxReflection) vReflectionUVW.x *= scaleReflection;
					if (abs(vReflectionUVW.y) != maxReflection) vReflectionUVW.y *= scaleReflection;
					if (abs(vReflectionUVW.z) != maxReflection) vReflectionUVW.z *= scaleReflection;
				}
			#endif

			environmentRadiance = textureCubeLodEXT(reflectionCubeSampler, vReflectionUVW, lodReflection).rgb * vReflectionInfos.x;
		#else
			environmentRadiance = textureCube(reflectionCubeSampler, vReflectionUVW, biasReflection).rgb * vReflectionInfos.x;
		#endif

		#ifdef USESPHERICALFROMREFLECTIONMAP
			#ifndef REFLECTIONMAP_SKYBOX
				vec3 normalEnvironmentSpace = (reflectionMatrix * vec4(normalW, 1)).xyz;
				environmentIrradiance = EnvironmentIrradiance(normalEnvironmentSpace);
			#endif
		#else
			environmentRadiance = toLinearSpace(environmentRadiance.rgb);

			environmentIrradiance = textureCube(reflectionCubeSampler, normalW, 20.).rgb * vReflectionInfos.x;
			environmentIrradiance = toLinearSpace(environmentIrradiance.rgb);
			environmentIrradiance *= 0.2; // Hack in case of no hdr cube map use for environment.
		#endif
	#else
		vec2 coords = vReflectionUVW.xy;

		#ifdef REFLECTIONMAP_PROJECTION
			coords /= vReflectionUVW.z;
		#endif

		coords.y = 1.0 - coords.y;
		#ifdef LODBASEDMICROSFURACE
			environmentRadiance = texture2DLodEXT(reflection2DSampler, coords, lodReflection).rgb * vReflectionInfos.x;
		#else
			environmentRadiance = texture2D(reflection2DSampler, coords, biasReflection).rgb * vReflectionInfos.x;
		#endif

		environmentRadiance = toLinearSpace(environmentRadiance.rgb);

		environmentIrradiance = texture2D(reflection2DSampler, coords, 20.).rgb * vReflectionInfos.x;
		environmentIrradiance = toLinearSpace(environmentIrradiance.rgb);
	#endif
#endif

#ifdef OVERLOADEDVALUES
	environmentIrradiance = mix(environmentIrradiance, vOverloadedReflection, vOverloadedMicroSurface.z);
	environmentRadiance = mix(environmentRadiance, vOverloadedReflection, vOverloadedMicroSurface.z);
#endif

	environmentRadiance *= vLightingIntensity.z;
	environmentIrradiance *= vLightingIntensity.z;

	// Specular Environment Fresnel.
	vec3 specularEnvironmentReflectance = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));

	// Compute refractance
	vec3 refractance = vec3(0.0, 0.0, 0.0);

#ifdef REFRACTION
	vec3 transmission = vec3(1.0, 1.0, 1.0);
	#ifdef LINKREFRACTIONTOTRANSPARENCY
		// Transmission based on alpha.
		transmission *= (1.0 - alpha);

		// Tint the material with albedo.
		// TODO. PBR Tinting.
		vec3 mixedAlbedo = surfaceAlbedoContribution.rgb * surfaceAlbedo.rgb;
		float maxChannel = max(max(mixedAlbedo.r, mixedAlbedo.g), mixedAlbedo.b);
		vec3 tint = clamp(maxChannel * mixedAlbedo, 0.0, 1.0);

		// Decrease Albedo Contribution
		surfaceAlbedoContribution *= alpha;

		// Decrease irradiance Contribution
		environmentIrradiance *= alpha;

		// Tint reflectance
		surfaceRefractionColor *= tint;

		// Put alpha back to 1;
		alpha = 1.0;
	#endif

	// Add Multiple internal bounces.
	vec3 bounceSpecularEnvironmentReflectance = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);
	specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, alpha);

	// In theory T = 1 - R.
	transmission *= 1.0 - specularEnvironmentReflectance;

	// Should baked in diffuse.
	refractance = surfaceRefractionColor * transmission;
#endif

	// Apply Energy Conservation taking in account the environment level only if the environment is present.
	surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;

	refractance *= vLightingIntensity.z;
	environmentRadiance *= specularEnvironmentReflectance;

	// Emissive
	vec3 surfaceEmissiveColor = vEmissiveColor;
#ifdef EMISSIVE
	vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV + uvOffset).rgb;
	surfaceEmissiveColor = toLinearSpace(emissiveColorTex.rgb) * surfaceEmissiveColor * vEmissiveInfos.y;
#endif

#ifdef OVERLOADEDVALUES
	surfaceEmissiveColor = mix(surfaceEmissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);
#endif

#ifdef EMISSIVEFRESNEL
	float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);

	surfaceEmissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	vec3 finalDiffuse = lightDiffuseContribution * surfaceAlbedoContribution;

	#ifdef OVERLOADEDSHADOWVALUES
		shadowedOnlyLightDiffuseContribution = shadowedOnlyLightDiffuseContribution * surfaceAlbedoContribution;
	#endif
#else
	#ifdef LINKEMISSIVEWITHALBEDO
		vec3 finalDiffuse = (lightDiffuseContribution + surfaceEmissiveColor) * surfaceAlbedoContribution;

		#ifdef OVERLOADEDSHADOWVALUES
			shadowedOnlyLightDiffuseContribution = (shadowedOnlyLightDiffuseContribution + surfaceEmissiveColor) * surfaceAlbedoContribution;
		#endif
	#else
		vec3 finalDiffuse = lightDiffuseContribution * surfaceAlbedoContribution + surfaceEmissiveColor;

		#ifdef OVERLOADEDSHADOWVALUES
			shadowedOnlyLightDiffuseContribution = shadowedOnlyLightDiffuseContribution * surfaceAlbedoContribution + surfaceEmissiveColor;
		#endif
	#endif
#endif

finalDiffuse.rgb += vAmbientColor;
finalDiffuse *= surfaceAlbedo.rgb;
finalDiffuse = max(finalDiffuse, 0.0);

#ifdef OVERLOADEDSHADOWVALUES
	shadowedOnlyLightDiffuseContribution += vAmbientColor;
	shadowedOnlyLightDiffuseContribution *= surfaceAlbedo.rgb;
	shadowedOnlyLightDiffuseContribution = max(shadowedOnlyLightDiffuseContribution, 0.0);
	finalDiffuse = mix(finalDiffuse, shadowedOnlyLightDiffuseContribution, (1.0 - vOverloadedShadowIntensity.y));
#endif

finalDiffuse = (finalDiffuse * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance) * ambientOcclusionColor;

#ifdef SPECULARTERM
	vec3 finalSpecular = lightSpecularContribution * surfaceReflectivityColor;
	#ifdef SPECULAROVERALPHA
		alpha = clamp(alpha + getLuminance(finalSpecular), 0., 1.);
	#endif
#else
	vec3 finalSpecular = vec3(0.0);
#endif

#ifdef RADIANCEOVERALPHA
	alpha = clamp(alpha + getLuminance(environmentRadiance), 0., 1.);
#endif

// Composition
// Reflection already includes the environment intensity.
vec4 finalColor = vec4(finalDiffuse + finalSpecular * vLightingIntensity.x + environmentRadiance + refractance, alpha);

#ifdef EMISSIVEASILLUMINATION
	finalColor.rgb += (surfaceEmissiveColor * vLightingIntensity.y);
#endif

#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            finalColor.rgb *= lightmapColor;
        #else
            finalColor.rgb += lightmapColor;
        #endif
    #endif
#endif

	finalColor = max(finalColor, 0.0);

#ifdef CAMERATONEMAP
	finalColor.rgb = toneMaps(finalColor.rgb);
#endif

	finalColor.rgb = toGammaSpace(finalColor.rgb);

#include<logDepthFragment>
#include<fogFragment>(color, finalColor)

#ifdef CAMERACONTRAST
	finalColor = contrasts(finalColor);
#endif

	finalColor.rgb = clamp(finalColor.rgb, 0., 1.);

#ifdef CAMERACOLORGRADING
	finalColor = colorGrades(finalColor);
#endif

#ifdef CAMERACOLORCURVES
	finalColor.rgb = applyColorCurves(finalColor.rgb);
#endif

	// Normal Display.
	// gl_FragColor = vec4(normalW * 0.5 + 0.5, 1.0);

	// Ambient reflection color.
	// gl_FragColor = vec4(ambientReflectionColor, 1.0);

	// Reflection color.
	// gl_FragColor = vec4(reflectionColor, 1.0);

	// Base color.
	// gl_FragColor = vec4(surfaceAlbedo.rgb, 1.0);

	// Specular color.
	// gl_FragColor = vec4(surfaceReflectivityColor.rgb, 1.0);

	// MicroSurface color.
	// gl_FragColor = vec4(microSurface, microSurface, microSurface, 1.0);

	// Specular Map
	// gl_FragColor = vec4(reflectivityMapColor.rgb, 1.0);

	// Refractance
	// gl_FragColor = vec4(refractance.rgb, 1.0);

	//// Emissive Color
	//vec2 test = vEmissiveUV * 0.5 + 0.5;
	//gl_FragColor = vec4(test.x, test.y, 1.0, 1.0);

	gl_FragColor = finalColor;
}