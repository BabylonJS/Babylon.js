#extension GL_EXT_draw_buffers : require

#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

#ifdef BUMP
varying mat4 vWorldView;
varying vec3 vNormalW;
#else
varying vec3 vNormalV;
#endif

varying vec4 vViewPos;

#if defined(POSITION) || defined(BUMP)
varying vec3 vPositionW;
#endif

#ifdef VELOCITY
varying vec4 vCurrentPosition;
varying vec4 vPreviousPosition;
#endif

#ifdef NEED_UV
varying vec2 vUV;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform vec2 vTangentSpaceParams;
#endif

#if defined(REFLECTIVITY) && (defined(HAS_SPECULAR) || defined(HAS_REFLECTIVITY))
varying vec2 vReflectivityUV;
uniform sampler2D reflectivitySampler;
#endif

#ifdef ALPHATEST
uniform sampler2D diffuseSampler;
#endif

#include<mrtFragmentDeclaration>[RENDER_TARGET_COUNT]
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>

void main() {
    #ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
    #endif

    vec3 normalOutput;
    #ifdef BUMP
    vec3 normalW = normalize(vNormalW);
    #include<bumpFragment>
    normalOutput = normalize(vec3(vWorldView * vec4(normalW, 0.0)));
    #else
    normalOutput = normalize(vNormalV);
    #endif

    #ifdef PREPASS
        #ifdef PREPASS_DEPTH
        gl_FragData[DEPTH_INDEX] = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
        #endif

        #ifdef PREPASS_NORMAL
        gl_FragData[NORMAL_INDEX] = vec4(normalOutput, 1.0);
        #endif
    #else
    gl_FragData[0] = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
    gl_FragData[1] = vec4(normalOutput, 1.0);
    #endif

    #ifdef POSITION
    gl_FragData[POSITION_INDEX] = vec4(vPositionW, 1.0);
    #endif

    #ifdef VELOCITY
    vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
	vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

    vec2 velocity = abs(a - b);
    velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    gl_FragData[VELOCITY_INDEX] = vec4(velocity, 0.0, 1.0);
    #endif

    #ifdef REFLECTIVITY
        #ifdef HAS_SPECULAR
            // Specular
            vec4 reflectivity = texture2D(reflectivitySampler, vReflectivityUV);
        #elif HAS_REFLECTIVITY
            // Reflectivity
            vec4 reflectivity = vec4(texture2D(reflectivitySampler, vReflectivityUV).rgb, 1.0);
        #else
            vec4 reflectivity = vec4(0.0, 0.0, 0.0, 1.0);
        #endif

        gl_FragData[REFLECTIVITY_INDEX] = reflectivity;
    #endif
}
