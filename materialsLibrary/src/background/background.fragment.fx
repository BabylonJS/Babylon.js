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

// Environment
#ifdef ENVIRONMENT
    #define sampleEnvironment(s, c) textureCube(s, c)

    uniform samplerCube environmentSampler;

    #ifdef ENVIRONMENTBLUR
        #ifdef TEXTURELODSUPPORT
            #define sampleEnvironmentLod(s, c, l) textureCubeLodEXT(s, c, l)
        #else
            uniform samplerCube environmentSamplerLow;
            uniform samplerCube environmentSamplerHigh;
        #endif
    #endif
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

#include<lightFragment>[0..maxSimultaneousLights]

// _____________________________ Environment ______________________________________
#ifdef ENVIRONMENT
    vec3 environmentColor = vec3(0., 0., 0.);

    // Skybox Fetch.
    vec3 environmentCoords = (vPositionW.xyz - vEyePosition.xyz);
    #ifdef INVERTCUBICMAP
            environmentCoords.y = 1.0 - environmentCoords.y;
    #endif
    // Rotate Environment
    environmentCoords = vec3(environmentMatrix * vec4(environmentCoords, 0));

    #ifdef ENVIRONMENTBLUR
        float environmentLOD = vEnvironmentInfo.y;

        #ifdef TEXTURELODSUPPORT
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            environmentLOD = environmentLOD * log2(vEnvironmentMicrosurfaceInfos.x) * vEnvironmentMicrosurfaceInfos.y + vEnvironmentMicrosurfaceInfos.z;
            environmentColor = sampleEnvironmentLod(environmentSampler, environmentCoords, environmentLOD).rgb;
        #else
            float lodEnvironmentNormalized = clamp(environmentLOD, 0., 1.);
            float lodEnvironmentNormalizedDoubled = lodEnvironmentNormalized * 2.0;

            vec3 environmentSpecularMid = sampleEnvironment(environmentSampler, environmentCoords).rgb;
            if(lodEnvironmentNormalizedDoubled < 1.0){
                environmentColor = mix(
                    sampleEnvironment(environmentSamplerHigh, environmentCoords).rgb,
                    environmentSpecularMid,
                    lodEnvironmentNormalizedDoubled
                );
            } else {
                environmentColor = mix(
                    environmentSpecularMid,
                    sampleEnvironment(environmentSamplerLow, environmentCoords).rgb,
                    lodEnvironmentNormalizedDoubled - 1.0
                );
            }
        #endif
    #else
        environmentColor = sampleEnvironment(environmentSampler, environmentCoords).rgb;
    #endif

    #ifdef GAMMAENVIRONMENT
        environmentColor = toLinearSpace(environmentColor.rgb);
    #endif

    // _____________________________ Levels _____________________________________
    environmentColor *= vEnvironmentInfo.x;

    // _____________________________ Alpha Information _______________________________
    #ifdef OPACITY
        vec3 reflectEnvironmentColor = vec3(0., 0., 0.);
        vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);

        #ifdef OPACITYRGB
            float environmentMix = getLuminance(opacityMap.rgb);
        #else
            float environmentMix = opacityMap.a;
        #endif

        environmentMix *= vOpacityInfo.y;

        #ifdef OPACITYFRESNEL
            // TODO. Change by camera forward Direction.
            float viewAngleToFloor = dot(normalW, normalize(vEyePosition));

            // Fade out the floor plane as the angle between the floor and the camera tends to 0 (starting from startAngle)
            const float startAngle = 0.1;
            float fadeFactor = clamp(viewAngleToFloor/startAngle, 0.0, 1.0);

            environmentMix *= fadeFactor * fadeFactor;
            shadow = mix(1., shadow, environmentMix);
        #endif

        // Cubic Fetch
        vec3 viewDir = vPositionW.xyz - vEyePosition.xyz;
        vec3 reflectEnvironmentCoords = reflect(viewDir, normalW);
        #ifdef INVERTCUBICMAP
            reflectEnvironmentCoords.y = 1.0 - reflectEnvironmentCoords.y;
        #endif
        // Rotate Environment
        reflectEnvironmentCoords = vec3(environmentMatrix * vec4(reflectEnvironmentCoords, 0));

        #ifdef ENVIRONMENTBLUR
            #ifdef TEXTURELODSUPPORT
                // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
                reflectEnvironmentColor = sampleEnvironmentLod(environmentSampler, reflectEnvironmentCoords, environmentLOD).rgb;
            #else
                vec3 reflectEnvironmentSpecularMid = sampleEnvironment(environmentSampler, reflectEnvironmentCoords).rgb;
                if(lodEnvironmentNormalizedDoubled < 1.0){
                    reflectEnvironmentColor = mix(
                        sampleEnvironment(environmentSamplerHigh, reflectEnvironmentCoords).rgb,
                        environmentSpecularMid,
                        lodEnvironmentNormalizedDoubled
                    );
                } else {
                    reflectEnvironmentColor = mix(
                        environmentSpecularMid,
                        sampleEnvironment(environmentSamplerLow, reflectEnvironmentCoords).rgb,
                        lodEnvironmentNormalizedDoubled - 1.0
                    );
                }
            #endif
        #else
            reflectEnvironmentColor = sampleEnvironment(environmentSampler, reflectEnvironmentCoords).rgb;
        #endif

        #ifdef GAMMAENVIRONMENT
            reflectEnvironmentColor = toLinearSpace(reflectEnvironmentColor.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        reflectEnvironmentColor *= vEnvironmentInfo.x;

        // _____________________________ MIX ________________________________________
        environmentColor = mix(environmentColor, reflectEnvironmentColor, environmentMix);
    #endif
#else
    vec3 environmentColor = vec3(1., 1., 1.);
#endif

// _____________________________ Composition ____________________________________
#ifdef RGBENVIRONMENT
    environmentColor = vec3(1., 1., 1.) * getLuminance(environmentColor);
#endif

    // Might think of conserving energy here.
    vec3 colorBase = environmentColor.r * vPrimaryColor.rgb * vPrimaryColor.a;
    colorBase += environmentColor.g * vSecondaryColor.rgb * vSecondaryColor.a;
    colorBase += environmentColor.b * vThirdColor.rgb * vThirdColor.a;

    colorBase = mix(colorBase * shadowLevel, colorBase, shadow);

    vec4 color = vec4(colorBase, 1.0);

#include<fogFragment>

#ifdef IMAGEPROCESSINGPOSTPROCESS
	// Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
	// this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
	color.rgb = clamp(color.rgb, 0., 30.0);
#else
	// Alway run even to ensure going back to gamma space.
	color = applyImageProcessing(color);
#endif

    gl_FragColor = color;
}