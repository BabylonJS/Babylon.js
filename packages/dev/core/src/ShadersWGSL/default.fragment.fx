#include<defaultUboDeclaration>

#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>

#define CUSTOM_FRAGMENT_BEGIN

// Input
varying vPositionW: vec3f;

#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif

#include<mainUVVaryingDeclaration>[1..7]

// Helper functions
#include<helperFunctions>

// Lights
#include<lightUboDeclaration>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

// Samplers
#include<samplerFragmentDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_SAMPLERNAME_,diffuse)
#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_SAMPLERNAME_,ambient)
#include<samplerFragmentDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_SAMPLERNAME_,opacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_SAMPLERNAME_,emissive)
#include<samplerFragmentDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_SAMPLERNAME_,lightmap)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)

#ifdef REFRACTION

#ifdef REFRACTIONMAP_3D
	var refractionCubeSamplerSampler: sampler;
	var refractionCubeSampler: texture_cube<f32>;
#else
	var refraction2DSamplerSampler: sampler;
	var refraction2DSampler: texture_2d<f32>;
#endif

#endif

#if defined(SPECULARTERM)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_SAMPLERNAME_,specular)
#endif

// Fresnel
#include<fresnelFunction>

// Reflection
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
	var reflectionCubeSamplerSampler: sampler;
	var reflectionCubeSampler: texture_cube<f32>;
#else
	var reflection2DSamplerSampler: sampler;
	var reflection2DSampler: texture_2d<f32>;
#endif

#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif

#endif

#include<reflectionFunction>

#endif

#include<imageProcessingDeclaration>

#include<imageProcessingFunctions>

#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

	var viewDirectionW: vec3f = normalize(scene.vEyePosition.xyz - fragmentInputs.vPositionW);

	// Base color
	var baseColor: vec4f =  vec4f(1., 1., 1., 1.);
	var diffuseColor: vec3f = uniforms.vDiffuseColor.rgb;

	// Alpha
	var alpha: f32 = uniforms.vDiffuseColor.a;

	// Bump
#ifdef NORMAL
	var normalW: vec3f = normalize(fragmentInputs.vNormalW);
#else
	var normalW: vec3f = normalize(-cross(dpdx(fragmentInputs.vPositionW), dpdy(fragmentInputs.vPositionW)));
#endif

#include<bumpFragment>

#ifdef TWOSIDEDLIGHTING
	normalW = select(-normalW, normalW, fragmentInputs.frontFacing);
#endif

#ifdef DIFFUSE
	baseColor = textureSample(diffuseSampler, diffuseSamplerSampler, fragmentInputs.vDiffuseUV + uvOffset);

	#if defined(ALPHATEST) && !defined(ALPHATEST_AFTERALLALPHACOMPUTATIONS)
		if (baseColor.a < uniforms.alphaCutOff) {
			discard;
		}
	#endif

	#ifdef ALPHAFROMDIFFUSE
		alpha *= baseColor.a;
	#endif

	#define CUSTOM_FRAGMENT_UPDATE_ALPHA

	baseColor = vec4f(baseColor.rgb * uniforms.vDiffuseInfos.y, baseColor.a);
#endif

#if defined(DECAL) && !defined(DECAL_AFTER_DETAIL)
	var decalColor: vec4f = textureSample(decalSampler, decalSamplerSampler, fragmentInputs.vDecalUV + uvOffset);
	#include<decalFragment>(surfaceAlbedo, baseColor, GAMMADECAL, _GAMMADECAL_NOTUSED_)
#endif

#include<depthPrePass>

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	baseColor = vec4f(baseColor.rgb * fragmentInputs.vColor.rgb, baseColor.a);
#endif

#ifdef DETAIL
    baseColor = vec4f(baseColor.rgb * 2.0 * mix(0.5, detailColor.r, uniforms.vDetailInfos.y), baseColor.a);
#endif

#if defined(DECAL) && defined(DECAL_AFTER_DETAIL)
	var decalColor: vec4f = textureSample(decalSampler, decalSamplerSampler, fragmentInputs.vDecalUV + uvOffset);
	#include<decalFragment>(surfaceAlbedo, baseColor, GAMMADECAL, _GAMMADECAL_NOTUSED_)
#endif

#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE

	// Ambient color
	var baseAmbientColor: vec3f =  vec3f(1., 1., 1.);

#ifdef AMBIENT
	baseAmbientColor = textureSample(ambientSampler, ambientSamplerSampler, fragmentInputs.vAmbientUV + uvOffset).rgb * uniforms.vAmbientInfos.y;
#endif

#define CUSTOM_FRAGMENT_BEFORE_LIGHTS

	// Specular map
#ifdef SPECULARTERM
	var glossiness: f32 = uniforms.vSpecularColor.a;
	var specularColor: vec3f = uniforms.vSpecularColor.rgb;

#ifdef SPECULAR
	var specularMapColor: vec4f = textureSample(specularSampler, specularSamplerSampler, fragmentInputs.vSpecularUV + uvOffset);
	specularColor = specularMapColor.rgb;
#ifdef GLOSSINESS
	glossiness = glossiness * specularMapColor.a;
#endif
#endif
#else
	var glossiness: f32 = 0.;
#endif

	// Lighting
	var diffuseBase: vec3f =  vec3f(0., 0., 0.);
	var info: lightingInfo;
#ifdef SPECULARTERM
	var specularBase: vec3f =  vec3f(0., 0., 0.);
#endif
	var shadow: f32 = 1.;
	var aggShadow: f32 = 0.;
	var numLights: f32 = 0.;

#ifdef LIGHTMAP
	var lightmapColor: vec4f = textureSample(lightmapSampler, lightmapSamplerSampler, fragmentInputs.vLightmapUV + uvOffset);
    #ifdef RGBDLIGHTMAP
        lightmapColor = vec4f(fromRGBD(lightmapColor), lightmapColor.a);
    #endif
	lightmapColor = vec4f(lightmapColor.rgb * vLightmapInfos.y, lightmapColor.a);
#endif

#include<lightFragment>[0..maxSimultaneousLights]

	aggShadow = aggShadow / numLights;

	// Refraction
	var refractionColor: vec4f =  vec4f(0., 0., 0., 1.);

#ifdef REFRACTION
	var refractionVector: vec3f = normalize(refract(-viewDirectionW, normalW, uniforms.vRefractionInfos.y));
	#ifdef REFRACTIONMAP_3D
        #ifdef USE_LOCAL_REFRACTIONMAP_CUBIC
            refractionVector = parallaxCorrectNormal(fragmentInputs.vPositionW, refractionVector, uniforms.vRefractionSize, uniforms.vRefractionPosition);
        #endif
		refractionVector.y = refractionVector.y * uniforms.vRefractionInfos.w;

		var refractionLookup: vec4f = textureSample(refractionCubeSampler, refractionCubeSamplerSampler, refractionVector);
		if (dot(refractionVector, viewDirectionW) < 1.0) {
			refractionColor = refractionLookup;
		}
	#else
		var vRefractionUVW: vec3f =  (uniforms.refractionMatrix * (scene.view *  vec4f(fragmentInputs.vPositionW + refractionVector * uniforms.vRefractionInfos.z, 1.0))).xyz;

		var refractionCoords: vec2f = vRefractionUVW.xy / vRefractionUVW.z;

		refractionCoords.y = 1.0 - refractionCoords.y;

		refractionColor = textureSample(refraction2DSampler, refraction2DSamplerSampler, refractionCoords);
	#endif
    #ifdef RGBDREFRACTION
        refractionColor = vec4f(fromRGBD(refractionColor), refractionColor.a);
    #endif
	#ifdef IS_REFRACTION_LINEAR
		refractionColor = vec4f(toGammaSpaceVec3(refractionColor.rgb), refractionColor.a);
	#endif
	refractionColor = vec4f(refractionColor.rgb * uniforms.vRefractionInfos.x, refractionColor.a);
#endif

// Reflection
var reflectionColor: vec4f =  vec4f(0., 0., 0., 1.);

#ifdef REFLECTION
	var vReflectionUVW: vec3f = computeReflectionCoords( vec4f(fragmentInputs.vPositionW, 1.0), normalW);
	#ifdef REFLECTIONMAP_OPPOSITEZ
		vReflectionUVW = vec3f(vReflectionUVW.x, vReflectionUVW.y, vReflectionUVW.z * -1.0);
	#endif

	#ifdef REFLECTIONMAP_3D
		#ifdef ROUGHNESS
			var bias: f32 = uniforms.vReflectionInfos.y;

			#ifdef SPECULARTERM
				#ifdef SPECULAR
					#ifdef GLOSSINESS
						bias *= (1.0 - specularMapColor.a);
					#endif
				#endif
			#endif

			reflectionColor = textureSampleLevel(reflectionCubeSampler, reflectionCubeSamplerSampler,vReflectionUVW, bias);
		#else
			reflectionColor = textureSample(reflectionCubeSampler, reflectionCubeSamplerSampler, vReflectionUVW);
		#endif
	#else
		var coords: vec2f = vReflectionUVW.xy;

		#ifdef REFLECTIONMAP_PROJECTION
			coords /= vReflectionUVW.z;
		#endif

		coords.y = 1.0 - coords.y;
		reflectionColor = textureSample(reflection2DSampler, reflection2DSamplerSampler, coords);
	#endif
    #ifdef RGBDREFLECTION
        reflectionColor = vec4f(fromRGBD(reflectionColor), reflectionColor.a);
    #endif
	#ifdef IS_REFLECTION_LINEAR
		reflectionColor = vec4f(toGammaSpaceVec3(reflectionColor.rgb), reflectionColor.a);
	#endif
	reflectionColor = vec4f(reflectionColor.rgb * uniforms.vReflectionInfos.x, reflectionColor.a);
	#ifdef REFLECTIONFRESNEL
		var reflectionFresnelTerm: f32 = computeFresnelTerm(viewDirectionW, normalW, uniforms.reflectionRightColor.a, uniforms.reflectionLeftColor.a);

		#ifdef REFLECTIONFRESNELFROMSPECULAR
			#ifdef SPECULARTERM
				reflectionColor = vec4f(reflectionColor.rgb * specularColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * uniforms.reflectionRightColor.rgb, reflectionColor.a);
			#else
				reflectionColor = vec4f(reflectionColor.rgb * uniforms.reflectionLeftColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * uniforms.reflectionRightColor.rgb, reflectionColor.a);
			#endif
		#else
			reflectionColor = vec4f(reflectionColor.rgb * uniforms.reflectionLeftColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * uniforms.reflectionRightColor.rgb, reflectionColor.a);
		#endif
	#endif
#endif

#ifdef REFRACTIONFRESNEL
	var refractionFresnelTerm: f32 = computeFresnelTerm(viewDirectionW, normalW, uniforms.refractionRightColor.a, uniforms.refractionLeftColor.a);

	refractionColor = vec4f(refractionColor.rgb * uniforms.refractionLeftColor.rgb * (1.0 - refractionFresnelTerm) + refractionFresnelTerm * uniforms.refractionRightColor.rgb, refractionColor.a);
#endif

#ifdef OPACITY
	var opacityMap: vec4f = textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV + uvOffset);

#ifdef OPACITYRGB
	opacityMap = vec4f(opacityMap.rgb *  vec3f(0.3, 0.59, 0.11), opacityMap.a);
	alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* uniforms.vOpacityInfos.y;
#else
	alpha *= opacityMap.a * uniforms.vOpacityInfos.y;
#endif

#endif

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= fragmentInputs.vColor.a;
#endif

#ifdef OPACITYFRESNEL
	var opacityFresnelTerm: f32 = computeFresnelTerm(viewDirectionW, normalW, uniforms.opacityParts.z, uniforms.opacityParts.w);

	alpha += uniforms.opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * uniforms.opacityParts.y;
#endif

#ifdef ALPHATEST
    #ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
        if (alpha < uniforms.alphaCutOff) {
            discard;
		}
    #endif
    #ifndef ALPHABLEND
        // Prevent to blend with the canvas.
        alpha = 1.0;
    #endif
#endif

	// Emissive
	var emissiveColor: vec3f = uniforms.vEmissiveColor;
#ifdef EMISSIVE
	emissiveColor += textureSample(emissiveSampler, emissiveSamplerSampler, fragmentInputs.vEmissiveUV + uvOffset).rgb * uniforms.vEmissiveInfos.y;
#endif

#ifdef EMISSIVEFRESNEL
	var emissiveFresnelTerm: f32 = computeFresnelTerm(viewDirectionW, normalW, uniforms.emissiveRightColor.a, uniforms.emissiveLeftColor.a);

	emissiveColor *= uniforms.emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * uniforms.emissiveRightColor.rgb;
#endif

	// Fresnel
#ifdef DIFFUSEFRESNEL
	var diffuseFresnelTerm: f32 = computeFresnelTerm(viewDirectionW, normalW, uniforms.diffuseRightColor.a, uniforms.diffuseLeftColor.a);

	diffuseBase *= uniforms.diffuseLeftColor.rgb * (1.0 - diffuseFresnelTerm) + diffuseFresnelTerm * uniforms.diffuseRightColor.rgb;
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	var finalDiffuse: vec3f = clamp(diffuseBase * diffuseColor + uniforms.vAmbientColor, vec3f(0.0), vec3f(1.0)) * baseColor.rgb;
#else
#ifdef LINKEMISSIVEWITHDIFFUSE
	var finalDiffuse: vec3f = clamp((diffuseBase + emissiveColor) * diffuseColor + uniforms.vAmbientColor, vec3f(0.0), vec3f(1.0)) * baseColor.rgb;
#else
	var finalDiffuse: vec3f = clamp(diffuseBase * diffuseColor + emissiveColor + uniforms.vAmbientColor, vec3f(0.0), vec3f(1.0)) * baseColor.rgb;
#endif
#endif

#ifdef SPECULARTERM
	var finalSpecular: vec3f = specularBase * specularColor;
	#ifdef SPECULAROVERALPHA
		alpha = clamp(alpha + dot(finalSpecular,  vec3f(0.3, 0.59, 0.11)), 0.0, 1.0);
	#endif
#else
	var finalSpecular: vec3f =  vec3f(0.0);
#endif

#ifdef REFLECTIONOVERALPHA
	alpha = clamp(alpha + dot(reflectionColor.rgb,  vec3f(0.3, 0.59, 0.11)), 0.0, 1.0);
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	var color: vec4f =  vec4f(clamp(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor.rgb + emissiveColor + refractionColor.rgb, 0.0, 1.0), alpha);
#else
	var color: vec4f =  vec4f(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor.rgb + refractionColor.rgb, alpha);
#endif

//Old lightmap calculation method
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
             color = vec4f(color.rgb * lightmapColor.rgb, color.a);
        #else
             color = vec4f(color.rgb + lightmapColor.rgb, color.a);
        #endif
    #endif
#endif

#define CUSTOM_FRAGMENT_BEFORE_FOG
color = vec4f(max(color.rgb, vec3f(0.)), color.a);
#include<logDepthFragment>
#include<fogFragment>

// Apply image processing if relevant. As this applies in linear space,
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	color = vec4f(toLinearSpaceVec3(color.rgb), color.a);
#else
	#ifdef IMAGEPROCESSING
		color = vec4f(toLinearSpaceVec3(color.rgb), color.a);
		color = applyImageProcessing(color);
	#endif
#endif

	color = vec4f(color.rgb, color.a * mesh.visibility);

#ifdef PREMULTIPLYALPHA
	// Convert to associative (premultiplied) format if needed.
	color = vec4f(color.rgb * color.a,  color.a);
#endif

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef PREPASS
	var writeGeometryInfo: f32 = select(0.0, 1.0, color.a > 0.4);
	var fragData: array<vec4<f32>, SCENE_MRT_COUNT>;

    fragData[0] = color; // We can't split irradiance on std material

    #ifdef PREPASS_POSITION
    fragData[PREPASS_POSITION_INDEX] =  vec4f(fragmentInputs.vPositionW, writeGeometryInfo);
    #endif

#ifdef PREPASS_LOCAL_POSITION
    fragData[PREPASS_LOCAL_POSITION_INDEX] =
        vec4f(fragmentInputs.vPosition, writeGeometryInfo);
#endif

#ifdef PREPASS_VELOCITY
    var a: vec2f = (fragmentInputs.vCurrentPosition.xy / fragmentInputs.vCurrentPosition.w) * 0.5 + 0.5;
    var b: vec2f = (fragmentInputs.vPreviousPosition.xy / fragmentInputs.vPreviousPosition.w) * 0.5 + 0.5;

    var velocity: vec2f = abs(a - b);
    velocity =  vec2f(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    fragData[PREPASS_VELOCITY_INDEX] =  vec4f(velocity, 0.0, writeGeometryInfo);
#elif defined(PREPASS_VELOCITY_LINEAR)
    var velocity : vec2f = vec2f(0.5) * ((fragmentInputs.vPreviousPosition.xy /
                                          fragmentInputs.vPreviousPosition.w) -
                                         (fragmentInputs.vCurrentPosition.xy /
                                          fragmentInputs.vCurrentPosition.w));
    fragData[PREPASS_VELOCITY_LINEAR_INDEX] =
        vec4f(velocity, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_IRRADIANCE
    fragData[PREPASS_IRRADIANCE_INDEX] =
        vec4f(0.0, 0.0, 0.0,
              writeGeometryInfo); //  We can't split irradiance on std material
#endif

#ifdef PREPASS_DEPTH
    fragData[PREPASS_DEPTH_INDEX] = vec4f(fragmentInputs.vViewPos.z, 0.0, 0.0,
                                          writeGeometryInfo); // Linear depth
#endif

#ifdef PREPASS_SCREENSPACE_DEPTH
    fragData[PREPASS_SCREENSPACE_DEPTH_INDEX] =
        vec4f(fragmentInputs.position.z, 0.0, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_NORMAL
#ifdef PREPASS_NORMAL_WORLDSPACE
    fragData[PREPASS_NORMAL_INDEX] =
        vec4f(normalW, writeGeometryInfo); // Normal
#else
    fragData[PREPASS_NORMAL_INDEX] =
        vec4f(normalize((scene.view * vec4f(normalW, 0.0)).rgb),
              writeGeometryInfo); // Normal
#endif
#endif

#ifdef PREPASS_WORLD_NORMAL
    fragData[PREPASS_WORLD_NORMAL_INDEX] =
        vec4f(normalW * 0.5 + 0.5, writeGeometryInfo); // Normal
#endif

#ifdef PREPASS_ALBEDO_SQRT
    fragData[PREPASS_ALBEDO_SQRT_INDEX] =
        vec4f(0.0, 0.0, 0.0,
              writeGeometryInfo); // We can't split albedo on std material
#endif
#ifdef PREPASS_REFLECTIVITY
#if defined(SPECULARTERM)
#if defined(SPECULAR)
    fragData[PREPASS_REFLECTIVITY_INDEX] =
        vec4f(toLinearSpaceVec4(specularMapColor)) *
        writeGeometryInfo; // no specularity if no visibility
#else
    fragData[PREPASS_REFLECTIVITY_INDEX] =
        vec4f(toLinearSpaceVec3(specularColor), 1.0) * writeGeometryInfo;
#endif
#else
    fragData[PREPASS_REFLECTIVITY_INDEX] =
        vec4f(0.0, 0.0, 0.0, 1.0) * writeGeometryInfo;
#endif
#endif

#if SCENE_MRT_COUNT > 0
    fragmentOutputs.fragData0 = fragData[0];
#endif
#if SCENE_MRT_COUNT > 1
    fragmentOutputs.fragData1 = fragData[1];
#endif
#if SCENE_MRT_COUNT > 2
    fragmentOutputs.fragData2 = fragData[2];
#endif
#if SCENE_MRT_COUNT > 3
    fragmentOutputs.fragData3 = fragData[3];
#endif
#if SCENE_MRT_COUNT > 4
    fragmentOutputs.fragData4 = fragData[4];
#endif
#if SCENE_MRT_COUNT > 5
    fragmentOutputs.fragData5 = fragData[5];
#endif
#if SCENE_MRT_COUNT > 6
    fragmentOutputs.fragData6 = fragData[6];
#endif
#if SCENE_MRT_COUNT > 7
    fragmentOutputs.fragData7 = fragData[7];
#endif
#endif

#if !defined(PREPASS) && !defined(ORDER_INDEPENDENT_TRANSPARENCY)
	fragmentOutputs.color = color;
#endif

#include<oitFragment>

#if ORDER_INDEPENDENT_TRANSPARENCY
	if (fragDepth == nearestDepth) {
		fragmentOutputs.frontColor = vec4f(fragmentOutputs.frontColor.rgb + color.rgb * color.a * alphaMultiplier, 1.0 - alphaMultiplier * (1.0 - color.a));
	} else {
		fragmentOutputs.backColor += color;
	}
#endif

#define CUSTOM_FRAGMENT_MAIN_END

}
