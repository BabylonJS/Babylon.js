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

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
	#define FROMLINEARSPACE;
#endif

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

// PBR
#include<shadowsFragmentFunctions>
#include<pbrFunctions>
#include<harmonicsFunctions>
#include<pbrLightFunctions>

#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
#include<clipPlaneFragment>

// _______________________________________________________________________________
// _____________________________ Geometry Information ____________________________
	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = normalize(cross(dFdx(vPositionW), dFdy(vPositionW)));
#endif

#include<bumpFragment>

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL) 
	normalW = gl_FrontFacing ? normalW : -normalW;
#endif

// _____________________________ Albedo Information ______________________________
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

// _____________________________ Alpha Information _______________________________
#ifdef OPACITY
	vec4 opacityMap = texture2D(opacitySampler, vOpacityUV + uvOffset);

	#ifdef OPACITYRGB
		alpha = getLuminance(opacityMap.rgb);
	#else
		alpha *= opacityMap.a;
	#endif

	alpha *= vOpacityInfos.y;
#endif

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

#if !defined(LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)
	#ifdef ALPHATEST
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

// _____________________________ AO    Information _______________________________
	vec3 ambientOcclusionColor = vec3(1., 1., 1.);

#ifdef AMBIENT
	vec3 ambientOcclusionColorMap = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb * vAmbientInfos.y;
	#ifdef AMBIENTINGRAYSCALE
		ambientOcclusionColorMap = vec3(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
	#endif
	ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, vAmbientInfos.z);
#endif

// _____________________________ Reflectivity Info _______________________________
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

	// Adapt microSurface.
	microSurface = clamp(microSurface, 0., 1.);
	// Compute roughness.
	float roughness = 1. - microSurface;

// _____________________________ Alpha Fresnel ___________________________________
#ifdef ALPHAFRESNEL
	// Convert approximate perceptual opacity (gamma-encoded opacity) to linear opacity (absorptance, or inverse transmission)
	// for use with the linear HDR render target. The final composition will be converted back to gamma encoded values for eventual display.
	// Uses power 2.0 rather than 2.2 for simplicity/efficiency, and because the mapping does not need to map the gamma applied to RGB.
	float opacityPerceptual = alpha;
	float opacity0 = opacityPerceptual * opacityPerceptual;
	float opacity90 = fresnelGrazingReflectance(opacity0);

	vec3 normalForward = faceforward(normalW, -viewDirectionW, normalW);

	// Calculate the appropriate linear opacity for the current viewing angle (formally, this quantity is the "directional absorptance").
	alpha = fresnelSchlickEnvironmentGGX(clamp(dot(V, normalForward), 0.0, 1.0), vec3(opacity0), vec3(opacity90), sqrt(microSurface)).x;
	
	#ifdef ALPHATEST
		if (alpha <= ALPHATESTVALUE)
			discard;

		#ifndef ALPHABLEND
			// Prevent to blend with the canvas.
			alpha = 1.0;
		#endif
	#endif
#endif

// _____________________________ Compute LODs Fetch ____________________________________
#ifdef LODBASEDMICROSFURACE
	float alphaG = convertRoughnessToAverageSlope(roughness);
#endif

// _____________________________ Refraction Info _______________________________________
#ifdef REFRACTION
	vec3 surfaceRefractionColor = vec3(0., 0., 0.);
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

// _____________________________ Reflection Info _______________________________________
#ifdef REFLECTION
	vec3 environmentRadiance = vReflectionColor.rgb;
	vec3 environmentIrradiance = vReflectionColor.rgb;
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

// ____________________________________________________________________________________
// _____________________________ Direct Lighting Param ________________________________
	// Compute N dot V.
	float NdotV = clamp(dot(normalW, viewDirectionW),0., 1.) + 0.00001;

	// Compute reflectance.
	float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);
	float reflectance90 = fresnelGrazingReflectance(reflectance);
	vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
	vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

	// Environment Reflectance
	vec3 specularEnvironmentReflectance = fresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));

// _____________________________ Direct Lighting Info __________________________________
	vec3 diffuseBase = vec3(0., 0., 0.);
#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif

#ifdef LIGHTMAP
	vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset).rgb * vLightmapInfos.y;
#endif

	lightingInfo info;
	float shadow = 1.; // 1 - shadowLevel
	float NdotL = -1.;

#include<lightFragment>[0..maxSimultaneousLights]

// _____________________________ Refractance+Tint ________________________________
#ifdef REFRACTION
	vec3 refractance = vec3(0.0, 0.0, 0.0);
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
	refractance = transmission;
#endif

// ______________________________________________________________________________
// _____________________________ Energy Conservation  ___________________________
	// Apply Energy Conservation taking in account the environment level only if 
	// the environment is present.
	surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;

// _____________________________ Diffuse ________________________________________
	vec3 finalDiffuse = diffuseBase;
	finalDiffuse.rgb += vAmbientColor;
	finalDiffuse *= surfaceAlbedo.rgb;
	finalDiffuse = max(finalDiffuse, 0.0);

// _____________________________ Irradiance ______________________________________
#ifdef REFLECTION
	vec3 finalIrradiance = environmentIrradiance;
	finalIrradiance *= surfaceAlbedo.rgb;
#endif

// _____________________________ Specular ________________________________________
#ifdef SPECULARTERM
	vec3 finalSpecular = specularBase;
	finalSpecular *= surfaceReflectivityColor;
	finalSpecular = max(finalSpecular, 0.0);
#endif

// _____________________________ Radiance_________________________________________
#ifdef REFLECTION
	vec3 finalRadiance = environmentRadiance;
	finalRadiance *= specularEnvironmentReflectance;
#endif

// _____________________________ Refraction ______________________________________
#ifdef REFRACTION
	vec3 finalRefraction = surfaceRefractionColor;
	finalRefraction *= refractance;
#endif

// _____________________________ Emissive ________________________________________
	vec3 finalEmissive = vEmissiveColor;
#ifdef EMISSIVE
	vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV + uvOffset).rgb;
	finalEmissive *= toLinearSpace(emissiveColorTex.rgb);
	finalEmissive *=  vEmissiveInfos.y;
#endif

// _____________________________ Highlights on Alpha _____________________________
#ifdef ALPHABLEND
	float luminanceOverAlpha = 0.0;
	#ifdef RADIANCEOVERALPHA
		luminanceOverAlpha += getLuminance(environmentRadiance);
	#endif

	#if defined(SPECULARTERM) && defined(SPECULAROVERALPHA)
		luminanceOverAlpha += getLuminance(finalSpecular);
	#endif

	#if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)
		alpha = clamp(alpha + luminanceOverAlpha * alpha, 0., 1.);
	#endif
#endif

// _______________________________________________________________________________
// _____________________________ Composition _____________________________________
	// Reflection already includes the environment intensity.
	vec4 finalColor = vec4(finalDiffuse			* ambientOcclusionColor * vLightingIntensity.x +
#ifdef REFLECTION
						finalIrradiance			* ambientOcclusionColor * vLightingIntensity.z +
#endif
#ifdef SPECULARTERM
						finalSpecular			* vLightingIntensity.x * vLightingIntensity.w +
#endif
#ifdef REFLECTION
						finalRadiance			* vLightingIntensity.z +
#endif
#ifdef REFRACTION
						finalRefraction			* vLightingIntensity.z +
#endif
						finalEmissive			* vLightingIntensity.y,
						alpha);

// _____________________________ LightMappping _____________________________________
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            finalColor.rgb *= lightmapColor;
        #else
            finalColor.rgb += lightmapColor;
        #endif
    #endif
#endif

// _____________________________ Finally ___________________________________________
	finalColor = max(finalColor, 0.0);

#include<logDepthFragment>
#include<fogFragment>(color, finalColor)

#ifdef IMAGEPROCESSINGPOSTPROCESS
	// Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
	// this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
	finalColor.rgb = clamp(finalColor.rgb, 0., 30.0);
#else
	// Alway run even to ensure going back to gamma space.
	finalColor = applyImageProcessing(finalColor);
#endif

#ifdef PREMULTIPLYALPHA
	// Convert to associative (premultiplied) format if needed.
	finalColor.rgb *= result.a;
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