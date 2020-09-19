#ifdef TEXTURELODSUPPORT
#extension GL_EXT_shader_texture_lod : enable
#endif

precision highp float;

#include<__decl__backgroundFragment>

#define RECIPROCAL_PI2 0.15915494

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

#ifdef REFLECTIONFRESNEL
    #define FRESNEL_MAXIMUM_ON_ROUGH 0.25

    vec3 fresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)
    {
        // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
        float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
        return reflectance0 + weight * (reflectance90 - reflectance0) * pow5(saturate(1.0 - VdotN));
    }
#endif

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

#ifndef BACKMAT_SHADOWONLY
    // _____________________________ REFLECTION ______________________________________
    vec4 reflectionColor = vec4(1., 1., 1., 1.);
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
                reflectionColor = sampleReflectionLod(reflectionSampler, reflectionCoords, reflectionLOD);
            #else
                float lodReflectionNormalized = saturate(reflectionLOD);
                float lodReflectionNormalizedDoubled = lodReflectionNormalized * 2.0;

                vec4 reflectionSpecularMid = sampleReflection(reflectionSampler, reflectionCoords);
                if(lodReflectionNormalizedDoubled < 1.0){
                    reflectionColor = mix(
                        sampleReflection(reflectionSamplerHigh, reflectionCoords),
                        reflectionSpecularMid,
                        lodReflectionNormalizedDoubled
                    );
                } else {
                    reflectionColor = mix(
                        reflectionSpecularMid,
                        sampleReflection(reflectionSamplerLow, reflectionCoords),
                        lodReflectionNormalizedDoubled - 1.0
                    );
                }
            #endif
        #else
            vec4 reflectionSample = sampleReflection(reflectionSampler, reflectionCoords);
            reflectionColor = reflectionSample;
        #endif

        #ifdef RGBDREFLECTION
            reflectionColor.rgb = fromRGBD(reflectionColor);
        #endif

        #ifdef GAMMAREFLECTION
            reflectionColor.rgb = toLinearSpace(reflectionColor.rgb);
        #endif

        #ifdef REFLECTIONBGR
            reflectionColor.rgb = reflectionColor.bgr;
        #endif

        // _____________________________ Levels _____________________________________
        reflectionColor.rgb *= vReflectionInfos.x;
    #endif

    // _____________________________ Diffuse Information _______________________________
    vec3 diffuseColor = vec3(1., 1., 1.);
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

        diffuseColor = diffuseMap.rgb;
    #endif

    // _____________________________ MIX ________________________________________
    #ifdef REFLECTIONFRESNEL
        vec3 colorBase = diffuseColor;
    #else
        vec3 colorBase = reflectionColor.rgb * diffuseColor;
    #endif
        colorBase = max(colorBase, 0.0);

    // ___________________________ COMPOSE _______________________________________
    #ifdef USERGBCOLOR
        vec3 finalColor = colorBase;
    #else
        #ifdef USEHIGHLIGHTANDSHADOWCOLORS
            vec3 mainColor = mix(vPrimaryColorShadow.rgb, vPrimaryColor.rgb, colorBase);
        #else
            vec3 mainColor = vPrimaryColor.rgb;
        #endif

        vec3 finalColor = colorBase * mainColor;
    #endif

    // ___________________________ FRESNELS _______________________________________
    #ifdef REFLECTIONFRESNEL
        vec3 reflectionAmount = vReflectionControl.xxx;
        vec3 reflectionReflectance0 = vReflectionControl.yyy;
        vec3 reflectionReflectance90 = vReflectionControl.zzz;
        float VdotN = dot(normalize(vEyePosition), normalW);

        vec3 planarReflectionFresnel = fresnelSchlickEnvironmentGGX(saturate(VdotN), reflectionReflectance0, reflectionReflectance90, 1.0);
        reflectionAmount *= planarReflectionFresnel;

        #ifdef REFLECTIONFALLOFF
            float reflectionDistanceFalloff = 1.0 - saturate(length(vPositionW.xyz - vBackgroundCenter) * vReflectionControl.w);
            reflectionDistanceFalloff *= reflectionDistanceFalloff;
            reflectionAmount *= reflectionDistanceFalloff;
        #endif

        finalColor = mix(finalColor, reflectionColor.rgb, saturate(reflectionAmount));
    #endif

    #ifdef OPACITYFRESNEL
        float viewAngleToFloor = dot(normalW, normalize(vEyePosition - vBackgroundCenter));

        // Fade out the floor plane as the angle between the floor and the camera tends to 0 (starting from startAngle)
        const float startAngle = 0.1;
        float fadeFactor = saturate(viewAngleToFloor/startAngle);

        finalAlpha *= fadeFactor * fadeFactor;
    #endif

    // ___________________________ SHADOWS _______________________________________
    #ifdef SHADOWINUSE
        finalColor = mix(finalColor * shadowLevel, finalColor, globalShadow);
    #endif

    // ___________________________ FINALIZE _______________________________________
    vec4 color = vec4(finalColor, finalAlpha);

#else
    vec4 color = vec4(vPrimaryColor.rgb, (1.0 - clamp(globalShadow, 0., 1.)) * alpha);
#endif

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

#ifdef NOISE
    color.rgb += dither(vPositionW.xy, 0.5);
    color = max(color, 0.0);
#endif

    gl_FragColor = color;
}
