#include<backgroundUboDeclaration>
#include<helperFunctions>

// Input
varying vPositionW: vec3f;

#ifdef MAINUV1
    varying vMainUV1: vec2f;
#endif 

#ifdef MAINUV2 
    varying vMainUV2: vec2f; 
#endif 

#ifdef NORMAL
    varying vNormalW: vec3f;
#endif

#ifdef DIFFUSE
    #if DIFFUSEDIRECTUV == 1
        #define vDiffuseUV vMainUV1
    #elif DIFFUSEDIRECTUV == 2
        #define vDiffuseUV vMainUV2
    #else
        varying vDiffuseUV: vec2f;
    #endif

    var diffuseSamplerSampler: sampler;
    var diffuseSampler: texture_2d<f32>;
#endif

// Reflection
#ifdef REFLECTION
    #ifdef REFLECTIONMAP_3D
        var reflectionSamplerSampler: sampler;
        var reflectionSampler: texture_cube<f32>;
        
        #ifdef TEXTURELODSUPPORT
        #else
            var reflectionLowSamplerSampler: sampler;
            var reflectionLowSampler: texture_cube<f32>;
            var reflectionHighSamplerSampler: sampler;
            var reflectionHighSampler: texture_cube<f32>;
        #endif
    #else
        var reflectionSamplerSampler: sampler;
        var reflectionSampler: texture_2d<f32>;

        #ifdef TEXTURELODSUPPORT
        #else
            var reflectionLowSamplerSampler: sampler;
            var reflectionLowSampler: texture_2d<f32>;
            var reflectionHighSamplerSampler: sampler;
            var reflectionHighSampler: texture_2d<f32>;
        #endif
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
#include<lightUboDeclaration>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<imageProcessingFunctions>

#include<logDepthDeclaration>

#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

#ifdef REFLECTIONFRESNEL
    #define FRESNEL_MAXIMUM_ON_ROUGH 0.25

    fn fresnelSchlickEnvironmentGGX(VdotN: f32, reflectance0: vec3f, reflectance90: vec3f, smoothness: f32) -> vec3f
    {
        // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
        var weight: f32 = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
        return reflectance0 + weight * (reflectance90 - reflectance0) * pow5(saturate(1.0 - VdotN));
    }
#endif

#ifdef PROJECTED_GROUND
    #include<intersectionFunctions>

    fn project(viewDirectionW: vec3f, eyePosition: vec3f) -> vec3f {
        var radius: f32 = uniforms.projectedGroundInfos.x;
        var height: f32 = uniforms.projectedGroundInfos.y;

        // reproject the cube ground to a sky sphere
        // to help with shadows
        // var p: vec3f = normalize(vPositionW);
        var camDir: vec3f = -viewDirectionW;
        var skySphereDistance: f32 = sphereIntersectFromOrigin(eyePosition, camDir, radius).x;
        var skySpherePositionW: vec3f = eyePosition + camDir * skySphereDistance;

        var p: vec3f = normalize(skySpherePositionW);
        var upEyePosition = vec3f(eyePosition.x, eyePosition.y - height, eyePosition.z);

        // Let s remove extra conditions in the following block
        // var intersection: f32 = sphereIntersectFromOrigin(eyePosition, p, radius).x;
        // if(intersection > 0.0) {
        //     var h: vec3f =  vec3f(0.0, -height, 0.0);
        //     var intersection2: f32 = diskIntersectWithBackFaceCulling(eyePosition, p, h, radius);
        //     p = (eyePosition + min(intersection, intersection2) * p) / radius;
        // } else {
        //     p =  vec3f(0.0, 1.0, 0.0);
        // }

        var sIntersection: f32 = sphereIntersectFromOrigin(upEyePosition, p, radius).x;
        var h: vec3f =  vec3f(0.0, -height, 0.0);
        var dIntersection: f32 = diskIntersectWithBackFaceCulling(upEyePosition, p, h, radius);
        p = (upEyePosition + min(sIntersection, dIntersection) * p);

        return p;
    }
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

    var viewDirectionW: vec3f = normalize(scene.vEyePosition.xyz - input.vPositionW);

// _____________________________ Normal Information ______________________________
#ifdef NORMAL
    var normalW: vec3f = normalize(fragmentInputs.vNormalW);
#else
    var normalW: vec3f =  vec3f(0.0, 1.0, 0.0);
#endif

// _____________________________ Light Information _______________________________
    var shadow: f32 = 1.;
    var globalShadow: f32 = 0.;
    var shadowLightCount: f32 = 0.;
    var aggShadow: f32 = 0.;
	var numLights: f32 = 0.;

#include<lightFragment>[0..maxSimultaneousLights]

#ifdef SHADOWINUSE
    globalShadow /= shadowLightCount;
#else
    globalShadow = 1.0;
#endif

#ifndef BACKMAT_SHADOWONLY
    // _____________________________ REFLECTION ______________________________________
    var reflectionColor: vec4f =  vec4f(1., 1., 1., 1.);
    #ifdef REFLECTION
        #ifdef PROJECTED_GROUND
            var reflectionVector: vec3f = project(viewDirectionW, scene.vEyePosition.xyz);
            reflectionVector =  (uniforms.reflectionMatrix * vec4f(reflectionVector, 1.)).xyz;
        #else
            var reflectionVector: vec3f = computeReflectionCoords( vec4f(fragmentInputs.vPositionW, 1.0), normalW);
        #endif

        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFLECTIONMAP_3D
            var reflectionCoords: vec3f = reflectionVector;
        #else
            var reflectionCoords: vec2f = reflectionVector.xy;
            #ifdef REFLECTIONMAP_PROJECTION
                reflectionCoords /= reflectionVector.z;
            #endif
            reflectionCoords.y = 1.0 - reflectionCoords.y;
        #endif

        #ifdef REFLECTIONBLUR
            var reflectionLOD: f32 = uniforms.vReflectionInfos.y;

            #ifdef TEXTURELODSUPPORT
                // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
                reflectionLOD = reflectionLOD * log2(uniforms.vReflectionMicrosurfaceInfos.x) * uniforms.vReflectionMicrosurfaceInfos.y + uniforms.vReflectionMicrosurfaceInfos.z;
                reflectionColor = textureSampleLevel(reflectionSampler, reflectionSamplerSampler, reflectionCoords, reflectionLOD);
            #else
                var lodReflectionNormalized: f32 = saturate(reflectionLOD);
                var lodReflectionNormalizedDoubled: f32 = lodReflectionNormalized * 2.0;

                var reflectionSpecularMid: vec4f = textureSample(reflectionSampler, reflectionSamplerSampler, reflectionCoords);
                if(lodReflectionNormalizedDoubled < 1.0){
                    reflectionColor = mix(
                        textureSample(reflectionrHighSampler, reflectionrHighSamplerSampler, reflectionCoords),
                        reflectionSpecularMid,
                        lodReflectionNormalizedDoubled
                    );
                } else {
                    reflectionColor = mix(
                        reflectionSpecularMid,
                        textureSample(reflectionLowSampler, reflectionLowSamplerSampler, reflectionCoords),
                        lodReflectionNormalizedDoubled - 1.0
                    );
                }
            #endif
        #else
            var reflectionSample: vec4f = textureSample(reflectionSampler, reflectionSamplerSampler, reflectionCoords);
            reflectionColor = reflectionSample;
        #endif

        #ifdef RGBDREFLECTION
            reflectionColor = vec4f(fromRGBD(reflectionColor).rgb, reflectionColor.a);
        #endif

        #ifdef GAMMAREFLECTION
            reflectionColor = vec4f(toLinearSpaceVec3(reflectionColor.rgb), reflectionColor.a);
        #endif

        #ifdef REFLECTIONBGR
            reflectionColor = vec4f(reflectionColor.bgr, reflectionColor.a);
        #endif

        // _____________________________ Levels _____________________________________
        reflectionColor = vec4f(reflectionColor.rgb * uniforms.vReflectionInfos.x, reflectionColor.a);
    #endif

    // _____________________________ Diffuse Information _______________________________
    var diffuseColor: vec3f =  vec3f(1., 1., 1.);
    var finalAlpha: f32 = uniforms.alpha;
        #ifdef DIFFUSE
            var diffuseMap: vec4f = textureSample(diffuseSampler, diffuseSamplerSampler, input.vDiffuseUV);
        #ifdef GAMMADIFFUSE
            diffuseMap = vec4f(toLinearSpaceVec3(diffuseMap.rgb), diffuseMap.a);
        #endif

    // _____________________________ Levels _____________________________________
        diffuseMap = vec4f(diffuseMap.rgb *uniforms.vDiffuseInfos.y, diffuseMap.a);

        #ifdef DIFFUSEHASALPHA
            finalAlpha *= diffuseMap.a;
        #endif

        diffuseColor = diffuseMap.rgb;
    #endif

    // _____________________________ MIX ________________________________________
    #ifdef REFLECTIONFRESNEL
        var colorBase: vec3f = diffuseColor;
    #else
        var colorBase: vec3f = reflectionColor.rgb * diffuseColor;
    #endif
        colorBase = max(colorBase, vec3f(0.0));

    // ___________________________ COMPOSE _______________________________________
    #ifdef USERGBCOLOR
        var finalColor: vec3f = colorBase;
    #else
        #ifdef USEHIGHLIGHTANDSHADOWCOLORS
            var mainColor: vec3f = mix(uniforms.vPrimaryColorShadow.rgb, uniforms.vPrimaryColor.rgb, colorBase);
        #else
            var mainColor: vec3f = uniforms.vPrimaryColor.rgb;
        #endif

        var finalColor: vec3f = colorBase * mainColor;
    #endif

    // ___________________________ FRESNELS _______________________________________
    #ifdef REFLECTIONFRESNEL
        var reflectionAmount: vec3f = uniforms.vReflectionControl.xxx;
        var reflectionReflectance0: vec3f = uniforms.vReflectionControl.yyy;
        var reflectionReflectance90: vec3f = uniforms.vReflectionControl.zzz;
        var VdotN: f32 = dot(normalize(scene.vEyePosition.xyz), normalW);

        var planarReflectionFresnel: vec3f = fresnelSchlickEnvironmentGGX(saturate(VdotN), reflectionReflectance0, reflectionReflectance90, 1.0);
        reflectionAmount *= planarReflectionFresnel;

        #ifdef REFLECTIONFALLOFF
            var reflectionDistanceFalloff: f32 = 1.0 - saturate(length(fragmentInputs.vPositionW.xyz - uniforms.vBackgroundCenter) * uniforms.vReflectionControl.w);
            reflectionDistanceFalloff *= reflectionDistanceFalloff;
            reflectionAmount *= reflectionDistanceFalloff;
        #endif

        finalColor = mix(finalColor, reflectionColor.rgb, saturateVec3(reflectionAmount));
    #endif

    #ifdef OPACITYFRESNEL
        var viewAngleToFloor: f32 = dot(normalW, normalize(scene.vEyePosition.xyz - uniforms.vBackgroundCenter));

        // Fade out the floor plane as the angle between the floor and the camera tends to 0 (starting from startAngle)
        const startAngle: f32 = 0.1;
        var fadeFactor: f32 = saturate(viewAngleToFloor/startAngle);

        finalAlpha *= fadeFactor * fadeFactor;
    #endif

    // ___________________________ SHADOWS _______________________________________
    #ifdef SHADOWINUSE
        finalColor = mix(finalColor * uniforms.shadowLevel, finalColor, globalShadow);
    #endif

    // ___________________________ FINALIZE _______________________________________
    var color: vec4f =  vec4f(finalColor, finalAlpha);

#else
    var color: vec4f =  vec4f(uniforms.vPrimaryColor.rgb, (1.0 - clamp(globalShadow, 0., 1.)) * uniforms.alpha);
#endif

#include<logDepthFragment>
#include<fogFragment>

#ifdef IMAGEPROCESSINGPOSTPROCESS
    // Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
    // this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
#if !defined(SKIPFINALCOLORCLAMP)
    color = vec4f(clamp(color.rgb, vec3f(0.), vec3f(30.0)), color.a);
#endif
#else
    // Alway run even to ensure going back to gamma space.
    color = applyImageProcessing(color);
#endif

#ifdef PREMULTIPLYALPHA
    // Convert to associative (premultiplied) format if needed.
    color = vec4f(color.rgb *color.a, color.a);
#endif

#ifdef NOISE
    color = vec4f(color.rgb + dither(fragmentInputs.vPositionW.xy, 0.5), color.a);
    color = max(color, vec4f(0.0));
#endif

    fragmentOutputs.color = color;

#define CUSTOM_FRAGMENT_MAIN_END
}
