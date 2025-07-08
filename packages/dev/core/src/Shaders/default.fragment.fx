#define CUSTOM_FRAGMENT_EXTENSION

#include<__decl__defaultFragment>

#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif

#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>

#define CUSTOM_FRAGMENT_BEGIN

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif

#include<mainUVVaryingDeclaration>[1..7]

// Helper functions
#include<helperFunctions>

// Lights
#include<lightClusteredDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]

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
uniform samplerCube refractionCubeSampler;
#else
uniform sampler2D refraction2DSampler;
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

#include<imageProcessingDeclaration>

#include<imageProcessingFunctions>

#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>



	vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);
	vec3 diffuseColor = vDiffuseColor.rgb;



	// Alpha
	float alpha = vDiffuseColor.a;

	// Bump
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = normalize(-cross(dFdx(vPositionW), dFdy(vPositionW)));
#endif

#include<bumpFragment>

#ifdef TWOSIDEDLIGHTING
	normalW = gl_FrontFacing ? normalW : -normalW;
#endif

#ifdef DIFFUSE
	baseColor = texture2D(diffuseSampler, vDiffuseUV + uvOffset);

	#if defined(ALPHATEST) && !defined(ALPHATEST_AFTERALLALPHACOMPUTATIONS)
		if (baseColor.a < alphaCutOff)
			discard;
	#endif

	#ifdef ALPHAFROMDIFFUSE
		alpha *= baseColor.a;
	#endif

	#define CUSTOM_FRAGMENT_UPDATE_ALPHA

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#if defined(DECAL) && !defined(DECAL_AFTER_DETAIL)
	vec4 decalColor = texture2D(decalSampler, vDecalUV + uvOffset);
	#include<decalFragment>(surfaceAlbedo, baseColor, GAMMADECAL, _GAMMADECAL_NOTUSED_)
#endif

#include<depthPrePass>

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	baseColor.rgb *= vColor.rgb;
#endif

#ifdef DETAIL
    baseColor.rgb = baseColor.rgb * 2.0 * mix(0.5, detailColor.r, vDetailInfos.y);
#endif

#if defined(DECAL) && defined(DECAL_AFTER_DETAIL)
	vec4 decalColor = texture2D(decalSampler, vDecalUV + uvOffset);
	#include<decalFragment>(surfaceAlbedo, baseColor, GAMMADECAL, _GAMMADECAL_NOTUSED_)
#endif

#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE

	// Ambient color
	vec3 baseAmbientColor = vec3(1., 1., 1.);

#ifdef AMBIENT
	baseAmbientColor = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb * vAmbientInfos.y;
#endif

#define CUSTOM_FRAGMENT_BEFORE_LIGHTS

	float glossiness = vSpecularColor.a;
	vec3 specularColor = vSpecularColor.rgb;
	// Specular map
#ifdef SPECULARTERM
	#ifdef SPECULAR
		vec4 specularMapColor = texture2D(specularSampler, vSpecularUV + uvOffset);
		specularColor = specularMapColor.rgb;
		#ifdef GLOSSINESS
			glossiness = glossiness * specularMapColor.a;
		#endif
	#endif
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
	lightingInfo info;
#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif
	float shadow = 1.;
	float aggShadow = 0.;
	float numLights = 0.;

#ifdef LIGHTMAP
	vec4 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset);
    #ifdef RGBDLIGHTMAP
        lightmapColor.rgb = fromRGBD(lightmapColor);
    #endif
	lightmapColor.rgb *= vLightmapInfos.y;
#endif

#include<lightFragment>[0..maxSimultaneousLights]

	aggShadow = aggShadow / numLights;

	// Refraction
	vec4 refractionColor = vec4(0., 0., 0., 1.);

#ifdef REFRACTION
	vec3 refractionVector = normalize(refract(-viewDirectionW, normalW, vRefractionInfos.y));
	#ifdef REFRACTIONMAP_3D
        #ifdef USE_LOCAL_REFRACTIONMAP_CUBIC
            refractionVector = parallaxCorrectNormal(vPositionW, refractionVector, vRefractionSize, vRefractionPosition);
        #endif
		refractionVector.y = refractionVector.y * vRefractionInfos.w;

		vec4 refractionLookup = textureCube(refractionCubeSampler, refractionVector);
		if (dot(refractionVector, viewDirectionW) < 1.0) {
			refractionColor = refractionLookup;
		}
	#else
		vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));

		vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;

		refractionCoords.y = 1.0 - refractionCoords.y;

		refractionColor = texture2D(refraction2DSampler, refractionCoords);
	#endif
    #ifdef RGBDREFRACTION
        refractionColor.rgb = fromRGBD(refractionColor);
    #endif
	#ifdef IS_REFRACTION_LINEAR
		refractionColor.rgb = toGammaSpace(refractionColor.rgb);
	#endif
	refractionColor.rgb *= vRefractionInfos.x;
#endif

// Reflection
vec4 reflectionColor = vec4(0., 0., 0., 1.);

#ifdef REFLECTION
	vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);
	#ifdef REFLECTIONMAP_OPPOSITEZ
		vReflectionUVW.z *= -1.0;
	#endif

	#ifdef REFLECTIONMAP_3D
		#ifdef ROUGHNESS
			float bias = vReflectionInfos.y;

			#ifdef SPECULARTERM
				#ifdef SPECULAR
					#ifdef GLOSSINESS
						bias *= (1.0 - specularMapColor.a);
					#endif
				#endif
			#endif

			reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW, bias);
		#else
			reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW);
		#endif
	#else
		vec2 coords = vReflectionUVW.xy;

		#ifdef REFLECTIONMAP_PROJECTION
			coords /= vReflectionUVW.z;
		#endif

		coords.y = 1.0 - coords.y;
		reflectionColor = texture2D(reflection2DSampler, coords);
	#endif
    #ifdef RGBDREFLECTION
        reflectionColor.rgb = fromRGBD(reflectionColor);
    #endif
	#ifdef IS_REFLECTION_LINEAR
		reflectionColor.rgb = toGammaSpace(reflectionColor.rgb);
	#endif
	reflectionColor.rgb *= vReflectionInfos.x;
	#ifdef REFLECTIONFRESNEL
		float reflectionFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, reflectionRightColor.a, reflectionLeftColor.a);

		#ifdef REFLECTIONFRESNELFROMSPECULAR
			#ifdef SPECULARTERM
				reflectionColor.rgb *= specularColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * reflectionRightColor.rgb;
			#else
				reflectionColor.rgb *= reflectionLeftColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * reflectionRightColor.rgb;
			#endif
		#else
			reflectionColor.rgb *= reflectionLeftColor.rgb * (1.0 - reflectionFresnelTerm) + reflectionFresnelTerm * reflectionRightColor.rgb;
		#endif
	#endif
#endif

#ifdef REFRACTIONFRESNEL
	float refractionFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, refractionRightColor.a, refractionLeftColor.a);

	refractionColor.rgb *= refractionLeftColor.rgb * (1.0 - refractionFresnelTerm) + refractionFresnelTerm * refractionRightColor.rgb;
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

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= vColor.a;
#endif

#ifdef OPACITYFRESNEL
	float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);

	alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;
#endif

#ifdef ALPHATEST
    #ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
        if (alpha < alphaCutOff)
            discard;
    #endif
    #ifndef ALPHABLEND
        // Prevent to blend with the canvas.
        alpha = 1.0;
    #endif
#endif

	// Emissive
	vec3 emissiveColor = vEmissiveColor;
#ifdef EMISSIVE
	emissiveColor += texture2D(emissiveSampler, vEmissiveUV + uvOffset).rgb * vEmissiveInfos.y;
#endif

#ifdef EMISSIVEFRESNEL
	float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);

	emissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;
#endif

	// Fresnel
#ifdef DIFFUSEFRESNEL
	float diffuseFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, diffuseRightColor.a, diffuseLeftColor.a);

	diffuseBase *= diffuseLeftColor.rgb * (1.0 - diffuseFresnelTerm) + diffuseFresnelTerm * diffuseRightColor.rgb;
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
#else
#ifdef LINKEMISSIVEWITHDIFFUSE
	vec3 finalDiffuse = clamp((diffuseBase + emissiveColor) * diffuseColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
#else
	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
#endif
#endif

#ifdef SPECULARTERM
	vec3 finalSpecular = specularBase * specularColor;
	#ifdef SPECULAROVERALPHA
		alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);
	#endif
#else
	vec3 finalSpecular = vec3(0.0);
#endif

#ifdef REFLECTIONOVERALPHA
	alpha = clamp(alpha + dot(reflectionColor.rgb, vec3(0.3, 0.59, 0.11)), 0., 1.);
#endif

	// Composition
#ifdef EMISSIVEASILLUMINATION
	vec4 color = vec4(clamp(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor.rgb + emissiveColor + refractionColor.rgb, 0.0, 1.0), alpha);
#else
	vec4 color = vec4(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor.rgb + refractionColor.rgb, alpha);
#endif

//Old lightmap calculation method
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            color.rgb *= lightmapColor.rgb;
        #else
            color.rgb += lightmapColor.rgb;
        #endif
    #endif
#endif

#define CUSTOM_FRAGMENT_BEFORE_FOG
color.rgb = max(color.rgb, 0.);
#include<logDepthFragment>
#include<fogFragment>

// Apply image processing if relevant. As this applies in linear space,
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	color.rgb = toLinearSpace(color.rgb);
#else
	#ifdef IMAGEPROCESSING
		color.rgb = toLinearSpace(color.rgb);
		color = applyImageProcessing(color);
	#endif
#endif

	color.a *= visibility;

#ifdef PREMULTIPLYALPHA
	// Convert to associative (premultiplied) format if needed.
	color.rgb *= color.a;
#endif

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef PREPASS
	float writeGeometryInfo = color.a > 0.4 ? 1.0 : 0.0;

    #ifdef PREPASS_COLOR
    	gl_FragData[PREPASS_COLOR_INDEX] = color; // We can't split irradiance on std material
	#endif

    #ifdef PREPASS_POSITION
    	gl_FragData[PREPASS_POSITION_INDEX] = vec4(vPositionW, writeGeometryInfo);
    #endif

	#ifdef PREPASS_LOCAL_POSITION
		gl_FragData[PREPASS_LOCAL_POSITION_INDEX] = vec4(vPosition, writeGeometryInfo);
	#endif

	#if defined(PREPASS_VELOCITY)
		vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
		vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

		vec2 velocity = abs(a - b);
		velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

		gl_FragData[PREPASS_VELOCITY_INDEX] = vec4(velocity, 0.0, writeGeometryInfo);
	#elif defined(PREPASS_VELOCITY_LINEAR)
		vec2 velocity = vec2(0.5) * ((vPreviousPosition.xy / vPreviousPosition.w) - (vCurrentPosition.xy / vCurrentPosition.w));
		gl_FragData[PREPASS_VELOCITY_LINEAR_INDEX] = vec4(velocity, 0.0, writeGeometryInfo);
	#endif

	#ifdef PREPASS_IRRADIANCE
		gl_FragData[PREPASS_IRRADIANCE_INDEX] = vec4(0.0, 0.0, 0.0,	writeGeometryInfo); //  We can't split irradiance on std material
	#endif

	#ifdef PREPASS_DEPTH
		gl_FragData[PREPASS_DEPTH_INDEX] = vec4(vViewPos.z, 0.0, 0.0, writeGeometryInfo); // Linear depth
	#endif

	#ifdef PREPASS_SCREENSPACE_DEPTH
		gl_FragData[PREPASS_SCREENSPACE_DEPTH_INDEX] = vec4(gl_FragCoord.z, 0.0, 0.0, writeGeometryInfo);
	#endif

	#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
		gl_FragData[PREPASS_NORMALIZED_VIEW_DEPTH_INDEX] = vec4(vNormViewDepth, 0.0, 0.0, writeGeometryInfo);
	#endif

	#ifdef PREPASS_NORMAL
		#ifdef PREPASS_NORMAL_WORLDSPACE
			gl_FragData[PREPASS_NORMAL_INDEX] =	vec4(normalW, writeGeometryInfo);
		#else
			gl_FragData[PREPASS_NORMAL_INDEX] =	vec4(normalize((view * vec4(normalW, 0.0)).rgb), writeGeometryInfo);
		#endif
	#endif

	#ifdef PREPASS_WORLD_NORMAL
		gl_FragData[PREPASS_WORLD_NORMAL_INDEX] = vec4(normalW * 0.5 + 0.5, writeGeometryInfo);
	#endif

	#ifdef PREPASS_ALBEDO
		gl_FragData[PREPASS_ALBEDO_INDEX] = vec4(baseColor.rgb, writeGeometryInfo);
	#endif

	#ifdef PREPASS_ALBEDO_SQRT
		gl_FragData[PREPASS_ALBEDO_SQRT_INDEX] = vec4(sqrt(baseColor.rgb), writeGeometryInfo);
	#endif

	#ifdef PREPASS_REFLECTIVITY
		#if defined(SPECULAR)
			gl_FragData[PREPASS_REFLECTIVITY_INDEX] = vec4(toLinearSpace(specularMapColor)) * writeGeometryInfo; // no specularity if no visibility
		#else
			gl_FragData[PREPASS_REFLECTIVITY_INDEX] = vec4(toLinearSpace(specularColor), 1.0) * writeGeometryInfo;
		#endif
	#endif
#endif

#if !defined(PREPASS) || defined(WEBGL2)
	gl_FragColor = color;
#endif
#include<oitFragment>

#if ORDER_INDEPENDENT_TRANSPARENCY
	if (fragDepth == nearestDepth) {
		frontColor.rgb += color.rgb * color.a * alphaMultiplier;
		frontColor.a = 1.0 - alphaMultiplier * (1.0 - color.a);
	} else {
		backColor += color;
	}
#endif

#define CUSTOM_FRAGMENT_MAIN_END

}
