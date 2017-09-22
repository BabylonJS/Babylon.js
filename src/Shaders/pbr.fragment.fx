#if defined(BUMP) || !defined(NORMAL) || defined(FORCENORMALFORWARD)
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

uniform vec4 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec4 vCameraInfos;

// Input
varying vec3 vPositionW;

#ifdef MAINUV1
	varying vec2 vMainUV1;
#endif 

#ifdef MAINUV2 
	varying vec2 vMainUV2; 
#endif 

#ifdef NORMAL
	varying vec3 vNormalW;
	#if defined(USESPHERICALFROMREFLECTIONMAP) && !defined(USESPHERICALINFRAGMENT)
		varying vec3 vEnvironmentIrradiance;
	#endif
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

// Samplers
#ifdef ALBEDO
	#if ALBEDODIRECTUV == 1
		#define vAlbedoUV vMainUV1
	#elif ALBEDODIRECTUV == 2
		#define vAlbedoUV vMainUV2
	#else
		varying vec2 vAlbedoUV;
	#endif
	uniform sampler2D albedoSampler;
#endif

#ifdef AMBIENT
	#if AMBIENTDIRECTUV == 1
		#define vAmbientUV vMainUV1
	#elif AMBIENTDIRECTUV == 2
		#define vAmbientUV vMainUV2
	#else
		varying vec2 vAmbientUV;
	#endif
	uniform sampler2D ambientSampler;
#endif

#ifdef OPACITY
	#if OPACITYDIRECTUV == 1
		#define vOpacityUV vMainUV1
	#elif OPACITYDIRECTUV == 2
		#define vOpacityUV vMainUV2
	#else
		varying vec2 vOpacityUV;
	#endif
	uniform sampler2D opacitySampler;
#endif

#ifdef EMISSIVE
	#if EMISSIVEDIRECTUV == 1
		#define vEmissiveUV vMainUV1
	#elif EMISSIVEDIRECTUV == 2
		#define vEmissiveUV vMainUV2
	#else
		varying vec2 vEmissiveUV;
	#endif
	uniform sampler2D emissiveSampler;
#endif

#ifdef LIGHTMAP
	#if LIGHTMAPDIRECTUV == 1
		#define vLightmapUV vMainUV1
	#elif LIGHTMAPDIRECTUV == 2
		#define vLightmapUV vMainUV2
	#else
		varying vec2 vLightmapUV;
	#endif
	uniform sampler2D lightmapSampler;
#endif

#ifdef REFLECTIVITY
	#if REFLECTIVITYDIRECTUV == 1
		#define vReflectivityUV vMainUV1
	#elif REFLECTIVITYDIRECTUV == 2
		#define vReflectivityUV vMainUV2
	#else
		varying vec2 vReflectivityUV;
	#endif
	uniform sampler2D reflectivitySampler;
#endif

#ifdef MICROSURFACEMAP
	#if MICROSURFACEMAPDIRECTUV == 1
		#define vMicroSurfaceSamplerUV vMainUV1
	#elif MICROSURFACEMAPDIRECTUV == 2
		#define vMicroSurfaceSamplerUV vMainUV2
	#else
		varying vec2 vMicroSurfaceSamplerUV;
	#endif
	uniform sampler2D microSurfaceSampler;
#endif

// Refraction
#ifdef REFRACTION
	#ifdef REFRACTIONMAP_3D
		#define sampleRefraction(s, c) textureCube(s, c)
		
		uniform samplerCube refractionSampler;

		#ifdef LODBASEDMICROSFURACE
			#define sampleRefractionLod(s, c, l) textureCubeLodEXT(s, c, l)
		#else
			uniform samplerCube refractionSamplerLow;
			uniform samplerCube refractionSamplerHigh;
		#endif
	#else
		#define sampleRefraction(s, c) texture2D(s, c)
		
		uniform sampler2D refractionSampler;

		#ifdef LODBASEDMICROSFURACE
			#define sampleRefractionLod(s, c, l) texture2DLodEXT(s, c, l)
		#else
			uniform samplerCube refractionSamplerLow;
			uniform samplerCube refractionSamplerHigh;
		#endif
	#endif
#endif

// Reflection
#ifdef REFLECTION
	#ifdef REFLECTIONMAP_3D
		#define sampleReflection(s, c) textureCube(s, c)

		uniform samplerCube reflectionSampler;
		
		#ifdef LODBASEDMICROSFURACE
			#define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
		#else
			uniform samplerCube reflectionSamplerLow;
			uniform samplerCube reflectionSamplerHigh;
		#endif
	#else
		#define sampleReflection(s, c) texture2D(s, c)

		uniform sampler2D reflectionSampler;

		#ifdef LODBASEDMICROSFURACE
			#define sampleReflectionLod(s, c, l) texture2DLodEXT(s, c, l)
		#else
			uniform samplerCube reflectionSamplerLow;
			uniform samplerCube reflectionSamplerHigh;
		#endif
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

#ifdef ENVIRONMENTBRDF
	uniform sampler2D environmentBrdfSampler;
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
	vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);

#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
#endif

#include<bumpFragment>

#if defined(FORCENORMALFORWARD) && defined(NORMAL)
	vec3 faceNormal = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
	#if defined(TWOSIDEDLIGHTING)
		faceNormal = gl_FrontFacing ? faceNormal : -faceNormal;
	#endif

	normalW *= sign(dot(normalW, faceNormal));
#endif

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

#include<depthPrePass>

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

	#ifdef REFLECTIVITY
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
	#if defined(ALPHATEST) || defined(ALPHABLEND)
		// Convert approximate perceptual opacity (gamma-encoded opacity) to linear opacity (absorptance, or inverse transmission)
		// for use with the linear HDR render target. The final composition will be converted back to gamma encoded values for eventual display.
		// Uses power 2.0 rather than 2.2 for simplicity/efficiency, and because the mapping does not need to map the gamma applied to RGB.
		float opacityPerceptual = alpha;
		float opacity0 = opacityPerceptual * opacityPerceptual;
		float opacity90 = fresnelGrazingReflectance(opacity0);

		vec3 normalForward = faceforward(normalW, -viewDirectionW, normalW);

		// Calculate the appropriate linear opacity for the current viewing angle (formally, this quantity is the "directional absorptance").
		alpha = fresnelSchlickEnvironmentGGX(clamp(dot(viewDirectionW, normalForward), 0.0, 1.0), vec3(opacity0), vec3(opacity90), sqrt(microSurface)).x;
		
		#ifdef ALPHATEST
			if (alpha <= ALPHATESTVALUE)
				discard;

			#ifndef ALPHABLEND
				// Prevent to blend with the canvas.
				alpha = 1.0;
			#endif
		#endif
	#endif
#endif

// _____________________________ Compute LODs Fetch ____________________________________
	// Compute N dot V.
	float NdotVUnclamped = dot(normalW, viewDirectionW);
	float NdotV = clamp(NdotVUnclamped,0., 1.) + 0.00001;
	float alphaG = convertRoughnessToAverageSlope(roughness);

// _____________________________ Refraction Info _______________________________________
#ifdef REFRACTION
	vec3 environmentRefraction = vec3(0., 0., 0.);
	
	vec3 refractionVector = refract(-viewDirectionW, normalW, vRefractionInfos.y);
	#ifdef REFRACTIONMAP_OPPOSITEZ
		refractionVector.z *= -1.0;
	#endif

	// _____________________________ 2D vs 3D Maps ________________________________
	#ifdef REFRACTIONMAP_3D
		refractionVector.y = refractionVector.y * vRefractionInfos.w;
		vec3 refractionCoords = refractionVector;
		refractionCoords = vec3(refractionMatrix * vec4(refractionCoords, 0));
	#else
		vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));
		vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;
		refractionCoords.y = 1.0 - refractionCoords.y;
	#endif

	#ifdef LODINREFRACTIONALPHA
		float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
	#else
		float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG, 1.0);
	#endif
	
	#ifdef LODBASEDMICROSFURACE
		// Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
		refractionLOD = refractionLOD * vRefractionMicrosurfaceInfos.y + vRefractionMicrosurfaceInfos.z;

		#ifdef LODINREFRACTIONALPHA
			// Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection 
			// is constrained to appropriate LOD levels in order to prevent aliasing.
			// The environment map is first sampled without custom LOD selection to determine
			// the hardware-selected LOD, and this is then used to constrain the final LOD selection
			// so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry 
			// where the normal is varying rapidly).

			// Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
			// manual calculation via derivatives is also possible, but for simplicity we use the 
			// hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
			float automaticRefractionLOD = UNPACK_LOD(sampleRefraction(refractionSampler, refractionCoords).a);
			float requestedRefractionLOD = max(automaticRefractionLOD, refractionLOD);
		#else
			float requestedRefractionLOD = refractionLOD;
		#endif

		environmentRefraction = sampleRefractionLod(refractionSampler, refractionCoords, requestedRefractionLOD).rgb;
	#else
		float lodRefractionNormalized = clamp(refractionLOD / log2(vRefractionMicrosurfaceInfos.x), 0., 1.);
		float lodRefractionNormalizedDoubled = lodRefractionNormalized * 2.0;

		vec3 environmentRefractionMid = sampleRefraction(refractionSampler, refractionCoords).rgb;
		if(lodRefractionNormalizedDoubled < 1.0){
			environmentRefraction = mix(
				sampleRefraction(refractionSamplerHigh, refractionCoords).rgb,
				environmentRefractionMid,
				lodRefractionNormalizedDoubled
			);
		}else{
			environmentRefraction = mix(
				environmentRefractionMid,
				sampleRefraction(refractionSamplerLow, refractionCoords).rgb,
				lodRefractionNormalizedDoubled - 1.0
			);
		}
	#endif

	#ifdef GAMMAREFRACTION
		environmentRefraction = toLinearSpace(environmentRefraction.rgb);
	#endif

	// _____________________________ Levels _____________________________________
	environmentRefraction *= vRefractionInfos.x;
#endif

// _____________________________ Reflection Info _______________________________________
#ifdef REFLECTION
	vec3 environmentRadiance = vec3(0., 0., 0.);
	vec3 environmentIrradiance = vec3(0., 0., 0.);

	vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);
	#ifdef REFLECTIONMAP_OPPOSITEZ
		reflectionVector.z *= -1.0;
	#endif

	// _____________________________ 2D vs 3D Maps ________________________________
	#ifdef REFLECTIONMAP_3D
		vec3 reflectionCoords = reflectionVector;
	#else
		vec2 reflectionCoords = reflectionVector.xy;
		#ifdef REFLECTIONMAP_PROJECTION
			reflectionCoords /= reflectionVector.z;
		#endif
		reflectionCoords.y = 1.0 - reflectionCoords.y;
	#endif
	
	#if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
		float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
	#else
		float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, 1.);
	#endif

	#ifdef LODBASEDMICROSFURACE
		// Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
		reflectionLOD = reflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;

		#ifdef LODINREFLECTIONALPHA
			// Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection 
			// is constrained to appropriate LOD levels in order to prevent aliasing.
			// The environment map is first sampled without custom LOD selection to determine
			// the hardware-selected LOD, and this is then used to constrain the final LOD selection
			// so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry 
			// where the normal is varying rapidly).

			// Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
			// manual calculation via derivatives is also possible, but for simplicity we use the 
			// hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
			float automaticReflectionLOD = UNPACK_LOD(sampleReflection(reflectionSampler, reflectionCoords).a);
			float requestedReflectionLOD = max(automaticReflectionLOD, reflectionLOD);
		#else
			float requestedReflectionLOD = reflectionLOD;
		#endif

		environmentRadiance = sampleReflectionLod(reflectionSampler, reflectionCoords, requestedReflectionLOD).rgb;
	#else
		float lodReflectionNormalized = clamp(reflectionLOD / log2(vReflectionMicrosurfaceInfos.x), 0., 1.);
		float lodReflectionNormalizedDoubled = lodReflectionNormalized * 2.0;

		vec3 environmentSpecularMid = sampleReflection(reflectionSampler, reflectionCoords).rgb;
		if(lodReflectionNormalizedDoubled < 1.0){
			environmentRadiance = mix(
				sampleReflection(reflectionSamplerHigh, reflectionCoords).rgb,
				environmentSpecularMid,
				lodReflectionNormalizedDoubled
			);
		}else{
			environmentRadiance = mix(
				environmentSpecularMid,
				sampleReflection(reflectionSamplerLow, reflectionCoords).rgb,
				lodReflectionNormalizedDoubled - 1.0
			);
		}
	#endif

	#ifdef GAMMAREFLECTION
		environmentRadiance = toLinearSpace(environmentRadiance.rgb);
	#endif

	// _____________________________ Irradiance ________________________________
	#ifdef USESPHERICALFROMREFLECTIONMAP
		#if defined(NORMAL) && !defined(USESPHERICALINFRAGMENT)
			environmentIrradiance = vEnvironmentIrradiance;
		#else
			vec3 irradianceVector = vec3(reflectionMatrix * vec4(normalW, 0)).xyz;
			#ifdef REFLECTIONMAP_OPPOSITEZ
				irradianceVector.z *= -1.0;
			#endif
			environmentIrradiance = environmentIrradianceJones(irradianceVector);
		#endif
	#endif

	// _____________________________ Levels _____________________________________
	environmentRadiance *= vReflectionInfos.x;
	environmentRadiance *= vReflectionColor.rgb;
	environmentIrradiance *= vReflectionColor.rgb;
#endif

// ____________________________________________________________________________________
// _____________________________ Direct Lighting Param ________________________________
	// Compute reflectance.
	float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);
	float reflectance90 = fresnelGrazingReflectance(reflectance);
	vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
	vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

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

// _________________________ Specular Environment Oclusion __________________________
#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
	// Indexed on cos(theta) and roughness
	vec2 brdfSamplerUV = vec2(NdotV, roughness);
	
	// We can find the scale and offset to apply to the specular value.
	vec4 environmentBrdf = texture2D(environmentBrdfSampler, brdfSamplerUV);

	vec3 specularEnvironmentReflectance = specularEnvironmentR0 * environmentBrdf.x + environmentBrdf.y;

	#ifdef AMBIENTINGRAYSCALE
		float ambientMonochrome = ambientOcclusionColor.r;
	#else
		float ambientMonochrome = getLuminance(ambientOcclusionColor);
	#endif

	float seo = environmentRadianceOcclusion(ambientMonochrome, NdotVUnclamped);
	specularEnvironmentReflectance *= seo;

	#ifdef BUMP
		#ifdef REFLECTIONMAP_3D
			float eho = environmentHorizonOcclusion(reflectionCoords, normalW);
			specularEnvironmentReflectance *= eho;
		#endif
	#endif
#else
	// Jones implementation of a well balanced fast analytical solution.
	vec3 specularEnvironmentReflectance = fresnelSchlickEnvironmentGGX(NdotV, specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));
#endif

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
		environmentRefraction *= tint;

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
	finalSpecular = max(finalSpecular, 0.0);

	// Full value needed for alpha.
	vec3 finalSpecularScaled = finalSpecular * vLightingIntensity.x * vLightingIntensity.w;
#endif

// _____________________________ Radiance_________________________________________
#ifdef REFLECTION
	vec3 finalRadiance = environmentRadiance;
	finalRadiance *= specularEnvironmentReflectance;

	// Full value needed for alpha. 
	vec3 finalRadianceScaled = finalRadiance * vLightingIntensity.z;
#endif

// _____________________________ Refraction ______________________________________
#ifdef REFRACTION
	vec3 finalRefraction = environmentRefraction;
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
	#if	defined(REFLECTION) && defined(RADIANCEOVERALPHA)
		luminanceOverAlpha += getLuminance(finalRadianceScaled);
	#endif

	#if defined(SPECULARTERM) && defined(SPECULAROVERALPHA)
		luminanceOverAlpha += getLuminance(finalSpecularScaled);
	#endif

	#if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)
		alpha = clamp(alpha + luminanceOverAlpha * luminanceOverAlpha, 0., 1.);
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
// Computed in the previous step to help with alpha luminance.
//						finalSpecular			* vLightingIntensity.x * vLightingIntensity.w +
						finalSpecularScaled +
#endif
#ifdef REFLECTION
// Comupted in the previous step to help with alpha luminance.
//						finalRadiance			* vLightingIntensity.z +
						finalRadianceScaled +
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
	finalColor.rgb *= finalColor.a;
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

	// Irradiance
	//gl_FragColor = vec4(specularEnvironmentReflectance.rgb, 1.0);
	//gl_FragColor = vec4(environmentIrradiance.rgb / 3.0, 1.0);

	// Specular color.
	//gl_FragColor = vec4(surfaceReflectivityColor.rgb, 1.0);

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

	// Specular Environment Occlusion
	//gl_FragColor = vec4(seo, seo, seo, 1.0);

	//// Horizon Environment Occlusion
	//gl_FragColor = vec4(eho, eho, eho, 1.0);

	//gl_FragColor = vec4(seo * eho, seo * eho, seo * eho, 1.0);
}