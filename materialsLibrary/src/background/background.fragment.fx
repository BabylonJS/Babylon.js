#ifdef TEXTURELODSUPPORT
#extension GL_EXT_shader_texture_lod : enable
#endif

precision highp float;

#include<__decl__backgroundFragment>

// Constants
uniform vec3 vEyePosition;

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
#endif

#ifdef DIFFUSE
    #if DIFFUSEDIRECTUV == 1
        #define vDiffuseUV vMainUV1
    #elif DIFFUSEDIRECTUV == 2
        #define vDiffuseUV vMainUV2
    #else
        varying vec2 vDiffuseUV;
    #endif
    uniform sampler2D diffuseSampler;
#endif

// Reflection
#ifdef REFLECTION
	#ifdef REFLECTIONMAP_3D
		#define sampleReflection(s, c) textureCube(s, c)

		uniform samplerCube reflectionSampler;
		
		#ifdef TEXTURELODSUPPORT
			#define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
		#else
			uniform samplerCube reflectionSamplerLow;
			uniform samplerCube reflectionSamplerHigh;
		#endif
	#else
		#define sampleReflection(s, c) texture2D(s, c)

		uniform sampler2D reflectionSampler;

		#ifdef TEXTURELODSUPPORT
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

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE;
#endif

// Prevent expensive light computations
#ifndef SHADOWONLY
    #define SHADOWONLY;
#endif


#include<imageProcessingDeclaration>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<helperFunctions>
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<imageProcessingFunctions>

#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
#include<clipPlaneFragment>

    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

// _____________________________ Normal Information ______________________________
#ifdef NORMAL
    vec3 normalW = normalize(vNormalW);
#else
    vec3 normalW = vec3(0.0, 1.0, 0.0);
#endif

// _____________________________ Light Information _______________________________
    float shadow = 1.;
    float globalShadow = 0.;
    float shadowLightCount = 0.;

#include<lightFragment>[0..maxSimultaneousLights]

#ifdef SHADOWINUSE
    globalShadow /= shadowLightCount;
#else
    globalShadow = 1.0;
#endif

// _____________________________ REFLECTION ______________________________________
vec3 environmentColor = vec3(1., 1., 1.);
#ifdef REFLECTION
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

    #ifdef REFLECTIONBLUR
        float reflectionLOD = vReflectionInfos.y;

        #ifdef TEXTURELODSUPPORT
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            reflectionLOD = reflectionLOD * log2(vReflectionMicrosurfaceInfos.x) * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;
            environmentColor = sampleReflectionLod(reflectionSampler, reflectionCoords, reflectionLOD).rgb;
        #else
            float lodReflectionNormalized = clamp(reflectionLOD, 0., 1.);
            float lodReflectionNormalizedDoubled = lodReflectionNormalized * 2.0;

            vec3 reflectionSpecularMid = sampleReflection(reflectionSampler, reflectionCoords).rgb;
            if(lodReflectionNormalizedDoubled < 1.0){
                environmentColor = mix(
                    sampleReflection(reflectionSamplerHigh, reflectionCoords).rgb,
                    reflectionSpecularMid,
                    lodReflectionNormalizedDoubled
                );
            } else {
                environmentColor = mix(
                    reflectionSpecularMid,
                    sampleReflection(reflectionSamplerLow, reflectionCoords).rgb,
                    lodReflectionNormalizedDoubled - 1.0
                );
            }
        #endif
    #else
        environmentColor = sampleReflection(reflectionSampler, reflectionCoords).rgb;
    #endif

    #ifdef GAMMAREFLECTION
        environmentColor = toLinearSpace(environmentColor.rgb);
    #endif

    // _____________________________ Levels _____________________________________
    environmentColor *= vReflectionInfos.x;
#endif

// _____________________________ Alpha Information _______________________________
vec3 groundColor = vec3(1., 1., 1.);
float finalAlpha = alpha;
#ifdef DIFFUSE
    vec4 diffuseMap = texture2D(diffuseSampler, vDiffuseUV);
    #ifdef GAMMADIFFUSE
        diffuseMap.rgb = toLinearSpace(diffuseMap.rgb);
    #endif

// _____________________________ Levels _____________________________________
    diffuseMap.rgb *= vDiffuseInfos.y;

    #ifdef DIFFUSEHASALPHA
        finalAlpha *= diffuseMap.a;
    #endif

    groundColor = diffuseMap.rgb;
#endif

    // _____________________________ MIX ________________________________________
    vec3 colorBase = environmentColor * groundColor;
    colorBase = max(colorBase, 0.0);

    // ___________________________ COMPOSE _______________________________________
#ifdef USERGBCOLOR
    vec3 finalColor = colorBase;
#else
    vec3 finalColor = colorBase.r * vPrimaryColor.rgb * vPrimaryColor.a;
    finalColor += colorBase.g * vSecondaryColor.rgb * vSecondaryColor.a;
    finalColor += colorBase.b * vTertiaryColor.rgb * vTertiaryColor.a;
#endif

#ifdef SHADOWINUSE
    finalColor = mix(finalColor * shadowLevel, finalColor, globalShadow);
#endif

#ifdef OPACITYFRESNEL
    // TODO. Change by camera forward Direction.
    float viewAngleToFloor = dot(normalW, normalize(vEyePosition));

    // Fade out the floor plane as the angle between the floor and the camera tends to 0 (starting from startAngle)
    const float startAngle = 0.1;
    float fadeFactor = clamp(viewAngleToFloor/startAngle, 0.0, 1.0);

    finalAlpha *= fadeFactor * fadeFactor;
#endif

    vec4 color = vec4(finalColor, finalAlpha);

#include<fogFragment>

#ifdef IMAGEPROCESSINGPOSTPROCESS
	// Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
	// this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
	color.rgb = clamp(color.rgb, 0., 30.0);
#else
	// Alway run even to ensure going back to gamma space.
	color = applyImageProcessing(color);
#endif

#ifdef PREMULTIPLYALPHA
	// Convert to associative (premultiplied) format if needed.
	color.rgb *= color.a;
#endif

    gl_FragColor = color;
}