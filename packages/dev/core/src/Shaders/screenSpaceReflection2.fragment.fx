#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
	#define TEXTUREFUNC(s, c, lod) texture2DLodEXT(s, c, lod)
	#define TEXTURECUBEFUNC(s, c, lod) textureLod(s, c, lod)
#else
	#define TEXTUREFUNC(s, c, bias) texture2D(s, c, bias)
	#define TEXTURECUBEFUNC(s, c, bias) textureCube(s, c, bias)
#endif

// References:
// * https://sakibsaikia.github.io/graphics/2016/12/26/Screen-Space-Reflection-in-Killing-Floor-2.html
// * https://github.com/kode80/kode80SSR
// * https://github.com/godotengine/godot/blob/master/servers/rendering/renderer_rd/shaders/effects/screen_space_reflection.glsl

uniform sampler2D textureSampler;

varying vec2 vUV;

#ifdef SSR_SUPPORTED

uniform sampler2D reflectivitySampler;
uniform sampler2D normalSampler;
uniform sampler2D depthSampler;
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
    uniform sampler2D backDepthSampler;
    uniform float backSizeFactor;
#endif
#ifdef SSR_USE_ENVIRONMENT_CUBE
    uniform samplerCube envCubeSampler;
    #ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
        uniform vec3 vReflectionPosition;
        uniform vec3 vReflectionSize;
    #endif
#endif

uniform mat4 view;
uniform mat4 invView;
uniform mat4 projection;
uniform mat4 invProjectionMatrix;
uniform mat4 projectionPixel;

uniform float nearPlaneZ;
uniform float stepSize;
uniform float maxSteps;
uniform float strength;
uniform float thickness;
uniform float roughnessFactor;
uniform float reflectionSpecularFalloffExponent;
uniform float maxDistance;
uniform float selfCollisionNumSkip;
uniform float reflectivityThreshold;

#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<screenSpaceRayTrace>

vec3 hash(vec3 a)
{
    a = fract(a * 0.8);
    a += dot(a, a.yxz + 19.19);
    return fract((a.xxy + a.yxx) * a.zyx);
}

float computeAttenuationForIntersection(ivec2 hitPixel, vec2 hitUV, vec3 vsRayOrigin, vec3 vsHitPoint, vec3 reflectionVector, float maxRayDistance, float numIterations) {
    float attenuation = 1.0;
    
#ifdef SSR_ATTENUATE_SCREEN_BORDERS
    // Attenuation against the border of the screen
    vec2 dCoords = smoothstep(0.2, 0.6, abs(vec2(0.5, 0.5) - hitUV.xy));
    
    attenuation *= clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
#endif

#ifdef SSR_ATTENUATE_INTERSECTION_DISTANCE
    // Attenuation based on the distance between the origin of the reflection ray and the intersection point
    attenuation *= 1.0 - clamp(distance(vsRayOrigin, vsHitPoint) / maxRayDistance, 0.0, 1.0);
#endif

#ifdef SSR_ATTENUATE_INTERSECTION_NUMITERATIONS
    // Attenuation based on the number of iterations performed to find the intersection
    attenuation *= 1.0 - (numIterations / maxSteps);
#endif

#ifdef SSR_ATTENUATE_BACKFACE_REFLECTION
    // This will check the direction of the normal of the reflection sample with the
    // direction of the reflection vector, and if they are pointing in the same direction,
    // it will drown out those reflections since backward facing pixels are not available 
    // for screen space reflection. Attenuate reflections for angles between 90 degrees 
    // and 100 degrees, and drop all contribution beyond the (-100,100)  degree range
    vec3 reflectionNormal = texelFetch(normalSampler, hitPixel, 0).xyz;
    float directionBasedAttenuation = smoothstep(-0.17, 0.0, dot(reflectionNormal, -reflectionVector));

    attenuation *= directionBasedAttenuation;
#endif

    return attenuation;
}
#endif

void main()
{
#ifdef SSR_SUPPORTED
    // Get color and reflectivity
    vec4 colorFull = TEXTUREFUNC(textureSampler, vUV, 0.0);
    vec3 color = colorFull.rgb;
    vec4 reflectivity = TEXTUREFUNC(reflectivitySampler, vUV, 0.0);
#ifndef SSR_DISABLE_REFLECTIVITY_TEST
    if (max(reflectivity.r, max(reflectivity.g, reflectivity.b)) <= reflectivityThreshold) {
        #ifdef SSR_USE_BLUR
            gl_FragColor = vec4(0.);
        #else
            gl_FragColor = colorFull;
        #endif
        return;
    }
#endif

#ifdef SSR_INPUT_IS_GAMMA_SPACE
    color = toLinearSpace(color);
#endif

    vec2 texSize = vec2(textureSize(depthSampler, 0));

    // Compute the reflected vector
    vec3 csNormal = texelFetch(normalSampler, ivec2(vUV * texSize), 0).xyz; // already normalized in the texture
    #ifdef SSR_DECODE_NORMAL
        csNormal = csNormal * 2.0 - 1.0;
    #endif
    #ifdef SSR_NORMAL_IS_IN_WORLDSPACE
        csNormal = (view * vec4(csNormal, 0.0)).xyz;
    #endif
    float depth = texelFetch(depthSampler, ivec2(vUV * texSize), 0).r;
    vec3 csPosition = computeViewPosFromUVDepth(vUV, depth, projection, invProjectionMatrix);
    vec3 csViewDirection = normalize(csPosition);

    vec3 csReflectedVector = reflect(csViewDirection, csNormal);

    // Get the environment color if an enviroment cube is defined
#ifdef SSR_USE_ENVIRONMENT_CUBE
    vec3 wReflectedVector = vec3(invView * vec4(csReflectedVector, 0.0));
    #ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
        vec4 worldPos = invView * vec4(csPosition, 1.0);
	    wReflectedVector = parallaxCorrectNormal(worldPos.xyz, normalize(wReflectedVector), vReflectionSize, vReflectionPosition);
    #endif
    #ifdef SSR_INVERTCUBICMAP
        wReflectedVector.y *= -1.0;
    #endif
    #ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
        wReflectedVector.z *= -1.0;
    #endif

    vec3 envColor = TEXTURECUBEFUNC(envCubeSampler, wReflectedVector, 0.0).xyz;
    #ifdef SSR_ENVIRONMENT_CUBE_IS_GAMMASPACE
        envColor = toLinearSpace(envColor);
    #endif
#else
    vec3 envColor = color;
#endif

    // Find the intersection between the ray (csPosition, csReflectedVector) and the depth buffer
    float reflectionAttenuation = 1.0;
    bool rayHasHit = false;
    vec2 startPixel;
    vec2 hitPixel;
    vec3 hitPoint;
    float numIterations;
#ifdef SSRAYTRACE_DEBUG
    vec3 debugColor;
#endif

#ifdef SSR_ATTENUATE_FACING_CAMERA
    // This will check the direction of the reflection vector with the view direction,
    // and if they are pointing in the same direction, it will drown out those reflections 
    // since we are limited to pixels visible on screen. Attenuate reflections for angles between 
    // 60 degrees and 75 degrees, and drop all contribution beyond the (-60,60)  degree range
    reflectionAttenuation *= 1.0 - smoothstep(0.25, 0.5, dot(-csViewDirection, csReflectedVector));
#endif
    if (reflectionAttenuation > 0.0) {
        #ifdef SSR_USE_BLUR
            vec3 jitt = vec3(0.);
        #else
            float roughness = 1.0 - reflectivity.a;
            vec3 jitt = mix(vec3(0.0), hash(csPosition) - vec3(0.5), roughness) * roughnessFactor; // jittering of the reflection direction to simulate roughness
        #endif

        vec2 uv2 = vUV * texSize;
        float c = (uv2.x + uv2.y) * 0.25;
        float jitter = mod(c, 1.0); // jittering to hide artefacts when stepSize is > 1

        rayHasHit = traceScreenSpaceRay1(
            csPosition,
            normalize(csReflectedVector + jitt),
            projectionPixel,
            depthSampler,
            texSize,
        #ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
            backDepthSampler,
            backSizeFactor,
        #endif
            thickness,
            nearPlaneZ,
            stepSize,
            jitter,
            maxSteps,
            maxDistance,
            selfCollisionNumSkip,
            startPixel,
            hitPixel,
            hitPoint,
            numIterations
#ifdef SSRAYTRACE_DEBUG
            ,debugColor
#endif
            );
    }

#ifdef SSRAYTRACE_DEBUG
    gl_FragColor = vec4(debugColor, 1.);
    return;
#endif

    // Fresnel
    vec3 F0 = reflectivity.rgb;
    vec3 fresnel = fresnelSchlickGGX(max(dot(csNormal, -csViewDirection), 0.0), F0, vec3(1.));

    // SSR color
    vec3 SSR = envColor;
    if (rayHasHit) {
        vec3 reflectedColor = texelFetch(textureSampler, ivec2(hitPixel), 0).rgb;
        #ifdef SSR_INPUT_IS_GAMMA_SPACE
            reflectedColor = toLinearSpace(reflectedColor);
        #endif
        reflectionAttenuation *= computeAttenuationForIntersection(ivec2(hitPixel), hitPixel / texSize, csPosition, hitPoint, csReflectedVector, maxDistance, numIterations);
        SSR = reflectedColor * reflectionAttenuation + (1.0 - reflectionAttenuation) * envColor;
    }

#ifndef SSR_BLEND_WITH_FRESNEL
    SSR *= fresnel;
#endif

    #ifdef SSR_USE_BLUR
        // from https://github.com/godotengine/godot/blob/master/servers/rendering/renderer_rd/shaders/effects/screen_space_reflection.glsl
        float blur_radius = 0.0;
        float roughness = 1.0 - reflectivity.a * (1.0 - roughnessFactor);
        if (roughness > 0.001) {
            float cone_angle = min(roughness, 0.999) * 3.14159265 * 0.5;
            float cone_len = distance(startPixel, hitPixel);
            float op_len = 2.0 * tan(cone_angle) * cone_len; // opposite side of iso triangle
            // fit to sphere inside cone (sphere ends at end of cone), something like this:
            // ___
            // \O/
            //  V
            //
            // as it avoids bleeding from beyond the reflection as much as possible. As a plus
            // it also makes the rough reflection more elongated.
            float a = op_len;
            float h = cone_len;
            float a2 = a * a;
            float fh2 = 4.0f * h * h;

            blur_radius = (a * (sqrt(a2 + fh2) - a)) / (4.0f * h);
        }

        gl_FragColor = vec4(SSR, blur_radius / 255.0); // the render target is RGBA8 so we must fit the radius in the 0..1 range
    #else
        // Mix current color with SSR color
        #ifdef SSR_BLEND_WITH_FRESNEL
            vec3 reflectionMultiplier = clamp(pow(fresnel * strength, vec3(reflectionSpecularFalloffExponent)), 0.0, 1.0);
        #else
            vec3 reflectionMultiplier = clamp(pow(reflectivity.rgb * strength, vec3(reflectionSpecularFalloffExponent)), 0.0, 1.0);
        #endif
        vec3 colorMultiplier = 1.0 - reflectionMultiplier;

        vec3 finalColor = (color * colorMultiplier) + (SSR * reflectionMultiplier);
        #ifdef SSR_OUTPUT_IS_GAMMA_SPACE
            finalColor = toGammaSpace(finalColor);
        #endif

        gl_FragColor = vec4(finalColor, colorFull.a);
    #endif
#else
    gl_FragColor = TEXTUREFUNC(textureSampler, vUV, 0.0);
#endif
}
