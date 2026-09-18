#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#define PREPASS_CUSTOM_VARYINGS
#include<prePassDeclaration>[SCENE_MRT_COUNT]

#if defined(GPUPICKER_DEPTH) && !defined(PREPASS)
layout(location=0) out highp vec4 glFragData[2];
#endif
#ifdef GPUPICKER_PACK_DEPTH
#include<packingFunctions>
#endif

varying vec4 vColor;
varying vec2 vPosition;

#ifdef PREPASS
uniform float geometryZeroAlphaDiscard;
#ifdef PREPASS_POSITION
varying vec3 vGeometryPositionW;
#endif
#ifdef PREPASS_LOCAL_POSITION
varying vec3 vGeometryPositionL;
#endif
#ifdef PREPASS_DEPTH
varying float vGeometryViewDepth;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying float vGeometryNormalizedViewDepth;
#endif
#ifdef PREPASS_NORMAL
varying vec3 vGeometryNormalV;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vec3 vGeometryNormalW;
#endif
#if defined(PREPASS_ALBEDO) || defined(PREPASS_ALBEDO_SQRT)
varying vec3 vGeometryAlbedo;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
varying vec4 vGeometryCurrentPosition;
varying vec4 vGeometryPreviousPosition;
#endif
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<gaussianSplattingFragmentDeclaration>

void main () {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

    vec4 finalColor = gaussianColor(vColor);

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

#ifdef PREPASS
    if (finalColor.a <= 0.0 && geometryZeroAlphaDiscard > 0.0) {
        discard;
    }
    vec4 geometryColor = finalColor;
    #if defined(PREPASS_ALBEDO) || defined(PREPASS_ALBEDO_SQRT)
        vec3 geometryAlbedo = vGeometryAlbedo;
    #endif
    #ifdef PREPASS_POSITION
        vec3 geometryPositionW = vGeometryPositionW;
    #endif
    #ifdef PREPASS_LOCAL_POSITION
        vec3 geometryPositionL = vGeometryPositionL;
    #endif
    #ifdef PREPASS_DEPTH
        float geometryViewDepth = vGeometryViewDepth;
    #endif
    #ifdef PREPASS_NORMALIZED_VIEW_DEPTH
        float geometryNormalizedViewDepth = vGeometryNormalizedViewDepth;
    #endif
    #ifdef PREPASS_NORMAL
        vec3 geometryNormalV = vGeometryNormalV;
    #endif
    #ifdef PREPASS_WORLD_NORMAL
        vec3 geometryNormalW = vGeometryNormalW;
    #endif
    #if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
        vec4 geometryCurrentPosition = vGeometryCurrentPosition;
        vec4 geometryPreviousPosition = vGeometryPreviousPosition;
    #endif
    #include<geometryRenderingFragment>
#elif defined(GPUPICKER_DEPTH)
    glFragData[0] = finalColor;
    #ifdef GPUPICKER_PACK_DEPTH
    glFragData[1] = pack(gl_FragCoord.z);
    #else
    glFragData[1] = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
    #endif
#else
    gl_FragColor = finalColor;
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}
