// References:
// * https://sakibsaikia.github.io/graphics/2016/12/26/Screen-Space-Reflection-in-Killing-Floor-2.html
// * https://github.com/kode80/kode80SSR
// * https://github.com/godotengine/godot/blob/master/servers/rendering/renderer_rd/shaders/effects/screen_space_reflection.glsl

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

varying vUV: vec2f;

#ifdef SSR_SUPPORTED

var reflectivitySamplerSampler: sampler;
var reflectivitySampler: texture_2d<f32>;
var normalSampler: texture_2d<f32>;
var depthSampler: texture_2d<f32>;
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
    var backDepthSampler: texture_2d<f32>;
    uniform backSizeFactor: f32;
#endif
#ifdef SSR_USE_ENVIRONMENT_CUBE

    var envCubeSamplerSampler: sampler;
    var envCubeSampler: texture_cube<f32>;
    #ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
        uniform vReflectionPosition: vec3f;
        uniform vReflectionSize: vec3f;
    #endif
#endif

uniform view: mat4x4f;
uniform invView: mat4x4f;
uniform projection: mat4x4f;
uniform invProjectionMatrix: mat4x4f;
uniform projectionPixel: mat4x4f;

uniform nearPlaneZ: f32;
uniform farPlaneZ: f32;
uniform stepSize: f32;
uniform maxSteps: f32;
uniform strength: f32;
uniform thickness: f32;
uniform roughnessFactor: f32;
uniform reflectionSpecularFalloffExponent: f32;
uniform maxDistance: f32;
uniform selfCollisionNumSkip: f32;
uniform reflectivityThreshold: f32;

#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<screenSpaceRayTrace>

fn hash(a: vec3f) -> vec3f
{
    var result = fract(a * 0.8);
    result += dot(result, result.yxz + 19.19);
    return fract((result.xxy + result.yxx) * result.zyx);
}

fn computeAttenuationForIntersection(ihitPixel: vec2f, hitUV: vec2f, vsRayOrigin: vec3f, vsHitPoint: vec3f, reflectionVector: vec3f, maxRayDistance: f32, numIterations: f32) -> f32 {
    var attenuation: f32 = 1.0;
    
#ifdef SSR_ATTENUATE_SCREEN_BORDERS
    // Attenuation against the border of the screen
    var dCoords: vec2f = smoothstep(vec2f(0.2), vec2f(0.6), abs( vec2f(0.5, 0.5) - hitUV.xy));
    
    attenuation *= clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
#endif

#ifdef SSR_ATTENUATE_INTERSECTION_DISTANCE
    // Attenuation based on the distance between the origin of the reflection ray and the intersection povar attenuation: i32 *= 1.0 - clamp(distance(vsRayOrigin, vsHitPoint) / maxRayDistance, 0.0, 1.0);
#endif

#ifdef SSR_ATTENUATE_INTERSECTION_NUMITERATIONS
    // Attenuation based on the number of iterations performed to find the intersection
    attenuation *= 1.0 - (numIterations / uniforms.maxSteps);
#endif

#ifdef SSR_ATTENUATE_BACKFACE_REFLECTION
    // This will check the direction of the normal of the reflection sample with the
    // direction of the reflection vector, and if they are pointing in the same direction,
    // it will drown out those reflections since backward facing pixels are not available 
    // for screen space reflection. Attenuate reflections for angles between 90 degrees 
    // and 100 degrees, and drop all contribution beyond the (-100,100)  degree range
    var reflectionNormal: vec3f = texelFetch(normalSampler, hitPixel, 0).xyz;
    var directionBasedAttenuation: f32 = smoothstep(-0.17, 0.0, dot(reflectionNormal, -reflectionVector));

    attenuation *= directionBasedAttenuation;
#endif

    return attenuation;
}
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#ifdef SSR_SUPPORTED
    // Get color and reflectivity
    var colorFull: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);
    var color: vec3f = colorFull.rgb;
    var reflectivity: vec4f = textureSampleLevel(reflectivitySampler, reflectivitySamplerSampler, input.vUV, 0.0);
#ifndef SSR_DISABLE_REFLECTIVITY_TEST
    if (max(reflectivity.r, max(reflectivity.g, reflectivity.b)) <= uniforms.reflectivityThreshold) {
        #ifdef SSR_USE_BLUR
            fragmentOutputs.color =  vec4f(0.);
        #else
            fragmentOutputs.color = colorFull;
        #endif
        return fragmentOutputs;
    }
#endif

#ifdef SSR_INPUT_IS_GAMMA_SPACE
    color = toLinearSpaceVec3(color);
#endif

    var texSize: vec2f =  vec2f(textureDimensions(depthSampler, 0));

    // Compute the reflected vector
    var csNormal: vec3f = textureLoad(normalSampler, vec2<i32>(input.vUV * texSize), 0).xyz; // already normalized in the texture
    #ifdef SSR_DECODE_NORMAL
        csNormal = csNormal * 2.0 - 1.0;
    #endif
    #ifdef SSR_NORMAL_IS_IN_WORLDSPACE
        csNormal = (uniforms.view *  vec4f(csNormal, 0.0)).xyz;
    #endif
    var depth: f32 = textureLoad(depthSampler, vec2<i32>(input.vUV * texSize), 0).r;
    #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
        depth = linearizeDepth(depth, uniforms.nearPlaneZ, uniforms.farPlaneZ);
    #endif
    var csPosition: vec3f = computeViewPosFromUVDepth(input.vUV, depth, uniforms.projection, uniforms.invProjectionMatrix);
    #ifdef ORTHOGRAPHIC_CAMERA
        var csViewDirection: vec3f =  vec3f(0., 0., 1.);
    #else
        var csViewDirection: vec3f = normalize(csPosition);
    #endif

    var csReflectedVector: vec3f = reflect(csViewDirection, csNormal);

    // Get the environment color if an enviroment cube is defined
#ifdef SSR_USE_ENVIRONMENT_CUBE
    var wReflectedVector: vec3f = (uniforms.invView *  vec4f(csReflectedVector, 0.0)).xyz;
    #ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
        var worldPos: vec4f = uniforms.invView *  vec4f(csPosition, 1.0);
	    wReflectedVector = parallaxCorrectNormal(worldPos.xyz, normalize(wReflectedVector), uniforms.vReflectionSize, uniforms.vReflectionPosition);
    #endif
    #ifdef SSR_INVERTCUBICMAP
        wReflectedVector.y *= -1.0;
    #endif
    #ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
        wReflectedVector.z *= -1.0;
    #endif

    var envColor: vec3f = textureSampleLevel(envCubeSampler, envCubeSamplerSampler, wReflectedVector, 0.0).xyz;
    #ifdef SSR_ENVIRONMENT_CUBE_IS_GAMMASPACE
        envColor = toLinearSpaceVec3(envColor);
    #endif
#else
    var envColor: vec3f = color;
#endif

    // Find the intersection between the ray (csPosition, csReflectedVector) and the depth buffer
    var reflectionAttenuation: f32 = 1.0;
    var rayHasHit: bool = false;
    var startPixel: vec2f;
    var hitPixel: vec2f;
    var hitPoint: vec3f;
    var numIterations: f32;
#ifdef SSRAYTRACE_DEBUG
    var debugColor: vec3f;
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
            var jitt: vec3f =  vec3f(0.);
        #else
            var roughness: f32 = 1.0 - reflectivity.a;
            var jitt: vec3f = mix( vec3f(0.0), hash(csPosition) -  vec3f(0.5), roughness) * uniforms.roughnessFactor; // jittering of the reflection direction to simulate roughness
        #endif

        var uv2: vec2f = input.vUV * texSize;
        var c: f32 = (uv2.x + uv2.y) * 0.25;
        var jitter: f32 = ((c)%(1.0)); // jittering to hide artefacts when stepSize is > 1

        rayHasHit = traceScreenSpaceRay1(
            csPosition,
            normalize(csReflectedVector + jitt),
            uniforms.projectionPixel,
            depthSampler,
            texSize,
        #ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
            backDepthSampler,
            uniforms.backSizeFactor,
        #endif
            uniforms.thickness,
            uniforms.nearPlaneZ,
            uniforms.farPlaneZ,
            uniforms.stepSize,
            jitter,
            uniforms.maxSteps,
            uniforms.maxDistance,
            uniforms.selfCollisionNumSkip,
            &startPixel,
            &hitPixel,
            &hitPoint,
            &numIterations
#ifdef SSRAYTRACE_DEBUG
            ,&debugColor
#endif
            );
    }

#ifdef SSRAYTRACE_DEBUG
    fragmentOutputs.color =  vec4f(debugColor, 1.);
    return fragmentOutputs;
#endif

    // Fresnel
    var F0: vec3f = reflectivity.rgb;
    var fresnel: vec3f = fresnelSchlickGGXVec3(max(dot(csNormal, -csViewDirection), 0.0), F0,  vec3f(1.));

    // SSR color
    var SSR: vec3f = envColor;
    if (rayHasHit) {
        var reflectedColor: vec3f = textureLoad(textureSampler, vec2<i32>(hitPixel), 0).rgb;
        #ifdef SSR_INPUT_IS_GAMMA_SPACE
            reflectedColor = toLinearSpaceVec3(reflectedColor);
        #endif
        reflectionAttenuation *= computeAttenuationForIntersection(hitPixel, hitPixel / texSize, csPosition, hitPoint, csReflectedVector, uniforms.maxDistance, numIterations);
        SSR = reflectedColor * reflectionAttenuation + (1.0 - reflectionAttenuation) * envColor;
    }

#ifndef SSR_BLEND_WITH_FRESNEL
    SSR *= fresnel;
#endif

    #ifdef SSR_USE_BLUR
        // from https://github.com/godotengine/godot/blob/master/servers/rendering/renderer_rd/shaders/effects/screen_space_reflection.glsl
        var blur_radius: f32 = 0.0;
        var roughness: f32 = 1.0 - reflectivity.a * (1.0 - uniforms.roughnessFactor);
        if (roughness > 0.001) {
            var cone_angle: f32 = min(roughness, 0.999) * 3.14159265 * 0.5;
            var cone_len: f32 = distance(startPixel, hitPixel);
            var op_len: f32 = 2.0 * tan(cone_angle) * cone_len; // opposite side of iso triangle
            // fit to sphere inside cone (sphere ends at end of cone), something like this:
            // ___
            // \O/
            //  V
            //
            // as it avoids bleeding from beyond the reflection as much as possible. As a plus
            // it also makes the rough reflection more elongated.
            var a: f32 = op_len;
            var h: f32 = cone_len;
            var a2: f32 = a * a;
            var fh2: f32 = 4.0f * h * h;

            blur_radius = (a * (sqrt(a2 + fh2) - a)) / (4.0f * h);
        }

        fragmentOutputs.color =  vec4f(SSR, blur_radius / 255.0); // the render target is RGBA8 so we must fit the radius in the 0..1 range
    #else
        // Mix current color with SSR color
        #ifdef SSR_BLEND_WITH_FRESNEL
            var reflectionMultiplier: vec3f = clamp(pow(fresnel * uniforms.strength,  vec3f(uniforms.reflectionSpecularFalloffExponent)), vec3f(0.0), vec3f(1.0));
        #else
            var reflectionMultiplier: vec3f = clamp(pow(reflectivity.rgb * uniforms.strength,  vec3f(uniforms.reflectionSpecularFalloffExponent)), vec3f(0.0), vec3f(1.0));
        #endif
        var colorMultiplier: vec3f = 1.0 - reflectionMultiplier;

        var finalColor: vec3f = (color * colorMultiplier) + (SSR * reflectionMultiplier);
        #ifdef SSR_OUTPUT_IS_GAMMA_SPACE
            finalColor = toGammaSpaceVec3(finalColor);
        #endif

        fragmentOutputs.color =  vec4f(finalColor, colorFull.a);
    #endif
#else
    fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);
#endif
}
