﻿#if defined(BUMP)|| !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LODBASEDMICROSFURACE
#extension GL_EXT_shader_texture_lod : enable
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

#include<__decl__pbrFragment>

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
	#include<colorGradingDefinition>
#endif

#ifdef CAMERACOLORCURVES
	#include<colorCurvesDefinition>
#endif

// PBR
#include<shadowsFragmentFunctions>
#include<pbrFunctions>

#ifdef CAMERACOLORGRADING
	#include<colorGrading>
#endif

#ifdef CAMERACOLORCURVES
	#include<colorCurves>
#endif

#include<harmonicsFunctions>
#include<pbrLightFunctions>

#include<helperFunctions>
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

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL) 
	normalW = gl_FrontFacing ? normalW : -normalW;
#endif

	// Albedo
	vec3 surfaceAlbedo = vAlbedoColor.rgb;

	// Alpha
	float alpha = vAlbedoColor.a;

#ifdef ALBEDO
	vec4 albedoTexture = texture2D(albedoSampler, vAlbedoUV + uvOffset);
	#if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)
		alpha *= albedoTexture.a;
	#endif

	surfaceAlbedo *= toLinearSpace(albedoTexture.rgb);
	surfaceAlbedo *= vAlbedoInfos.y;
#endif

#ifndef LINKREFRACTIONTOTRANSPARENCY
	#if defined(ALPHATEST) && defined(ALPHATESTVALUE)
		if (alpha <= ALPHATESTVALUE)
			discard;
			
			#ifndef ALPHABLEND
				// Prevent to blend with the canvas.
				alpha = 1.0;
			#endif
	#endif
#endif

#ifdef VERTEXCOLOR
	surfaceAlbedo *= vColor.rgb;
#endif

	// Ambient color
	vec3 ambientOcclusionColor = vec3(1., 1., 1.);

#ifdef AMBIENT
	vec3 ambientOcclusionColorMap = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb * vAmbientInfos.y;
	#ifdef AMBIENTINGRAYSCALE
		ambientOcclusionColorMap = vec3(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
	#endif
	ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, vAmbientInfos.z);
#endif

	// Reflectivity map
	float microSurface = vReflectivityColor.a;
	vec3 surfaceReflectivityColor = vReflectivityColor.rgb;

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
	vec3 baseColor = surfaceAlbedo;

	// Default specular reflectance at normal incidence.
	// 4% corresponds to index of refraction (IOR) of 1.50, approximately equal to glass.
	const vec3 DefaultSpecularReflectanceDielectric = vec3(0.04, 0.04, 0.04);

	// Compute the converted diffuse.
	surfaceAlbedo = mix(baseColor.rgb * (1.0 - DefaultSpecularReflectanceDielectric.r), vec3(0., 0., 0.), metallicRoughness.r);

	// Compute the converted reflectivity.
	surfaceReflectivityColor = mix(DefaultSpecularReflectanceDielectric, baseColor, metallicRoughness.r);
#else
	#ifdef REFLECTIVITY
		vec4 surfaceReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);
		surfaceReflectivityColor *= toLinearSpace(surfaceReflectivityColorMap.rgb);
		surfaceReflectivityColor *= vReflectivityInfos.y;

		#ifdef MICROSURFACEFROMREFLECTIVITYMAP
			microSurface *= surfaceReflectivityColorMap.a;
			microSurface *= vReflectivityInfos.z;
		#else
			#ifdef MICROSURFACEAUTOMATIC
				microSurface *= computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);
			#endif

			#ifdef MICROSURFACEMAP
				vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
				microSurface *= microSurfaceTexel.r;
			#endif
		#endif
	#endif
#endif

	// Compute N dot V.
	float NdotV = clamp(dot(normalW, viewDirectionW),0., 1.) + 0.00001;

	// Adapt microSurface.
	microSurface = clamp(microSurface, 0., 1.);

	// Compute roughness.
	float roughness = 1. - microSurface;

	#ifdef LIGHTMAP
  		vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset).rgb * vLightmapInfos.y;
  	#endif

	float NdotL = -1.;

	// Compute reflectance.
	float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);

	// For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
	vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
	vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);

#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif
	
	lightingInfo info;
	float shadow = 1.; // 1 - shadowLevel

#include<lightFragment>[0..maxSimultaneousLights]

	vec3 lightDiffuseContribution = diffuseBase;

#ifdef SPECULARTERM
	vec3 lightSpecularContribution = specularBase * vLightingIntensity.w;
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
		vec3 mixedAlbedo = surfaceAlbedo;
		float maxChannel = max(max(mixedAlbedo.r, mixedAlbedo.g), mixedAlbedo.b);
		vec3 tint = clamp(maxChannel * mixedAlbedo, 0.0, 1.0);

		// Decrease Albedo Contribution
		surfaceAlbedo *= alpha;

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
	surfaceEmissiveColor = toLinearSpace(emissiveColorTex.rgb) * surfaceEmissiveColor;
	surfaceEmissiveColor *=  vEmissiveInfos.y;
#endif

#ifdef EMISSIVEFRESNEL
	float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);

	surfaceEmissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;
#endif

	// Composition
	vec3 finalDiffuse = lightDiffuseContribution;
#ifndef EMISSIVEASILLUMINATION
	finalDiffuse += surfaceEmissiveColor;
#endif

finalDiffuse.rgb += vAmbientColor;
finalDiffuse *= surfaceAlbedo.rgb;
finalDiffuse = max(finalDiffuse, 0.0);
finalDiffuse = (finalDiffuse * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance) * ambientOcclusionColor;

float luminanceOverAlpha = 0.0;
#ifdef RADIANCEOVERALPHA
	luminanceOverAlpha += getLuminance(environmentRadiance);
#endif

#ifdef SPECULARTERM
	vec3 finalSpecular = lightSpecularContribution * surfaceReflectivityColor;
	#ifdef SPECULAROVERALPHA
		luminanceOverAlpha += getLuminance(finalSpecular);
	#endif
#else
	vec3 finalSpecular = vec3(0.0);
#endif
finalSpecular *= vLightingIntensity.x;

#if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)
	alpha = clamp(alpha + luminanceOverAlpha * alpha, 0., 1.);
#endif

// Composition
// Reflection already includes the environment intensity.
vec4 finalColor = vec4(finalDiffuse + finalSpecular + environmentRadiance + refractance, alpha);
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

#include<logDepthFragment>
#include<fogFragment>(color, finalColor)

#ifdef CAMERACONTRAST
	finalColor = contrasts(finalColor);
#endif

#ifdef LDROUTPUT
	finalColor.rgb = toGammaSpace(finalColor.rgb);

	finalColor.rgb = clamp(finalColor.rgb, 0., 1.);

	#ifdef CAMERACOLORGRADING
		finalColor = colorGrades(finalColor);
	#endif

	#ifdef CAMERACOLORCURVES
		finalColor.rgb = applyColorCurves(finalColor.rgb);
	#endif
#else
	//sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
	//this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
	finalColor.rgb = clamp(finalColor.rgb, 0., 30.0);
#endif

	gl_FragColor = finalColor;

	// Normal Display.
	//gl_FragColor = vec4(normalW * 0.5 + 0.5, 1.0);

	// Ambient reflection color.
	// gl_FragColor = vec4(ambientReflectionColor, 1.0);

	// Reflection color.
	// gl_FragColor = vec4(reflectionColor, 1.0);

	// Base color.
	// gl_FragColor = vec4(surfaceAlbedo.rgb, 1.0);

	// Diffuse Direct Lighting
	// gl_FragColor = vec4(diffuseBase.rgb, 1.0);

	// Specular Lighting
	// gl_FragColor = vec4(specularBase.rgb, 1.0);

	// Final Specular
	// gl_FragColor = vec4(finalSpecular.rgb, 1.0);

	// Specular color.
	// gl_FragColor = vec4(surfaceReflectivityColor.rgb, 1.0);

	// MicroSurface color.
	// gl_FragColor = vec4(microSurface, microSurface, microSurface, 1.0);

	// Roughness.
	// gl_FragColor = vec4(roughness, roughness, roughness, 1.0);

	// Specular Map
	// gl_FragColor = vec4(reflectivityMapColor.rgb, 1.0);

	// Refractance
	// gl_FragColor = vec4(refractance.rgb, 1.0);

	//// Emissive Color
	//vec2 test = vEmissiveUV * 0.5 + 0.5;
	//gl_FragColor = vec4(test.x, test.y, 1.0, 1.0);
}