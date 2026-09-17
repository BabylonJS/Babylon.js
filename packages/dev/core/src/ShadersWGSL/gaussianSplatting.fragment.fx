#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#define PREPASS_CUSTOM_VARYINGS
#include<prePassDeclaration>[SCENE_MRT_COUNT]

#ifdef GPUPICKER_PACK_DEPTH
#include<packingFunctions>
#endif

varying vColor: vec4f;
varying vPosition: vec2f;

#ifdef PREPASS
uniform geometryZeroAlphaDiscard: f32;
#ifdef PREPASS_POSITION
varying vGeometryPositionW: vec3f;
#endif
#ifdef PREPASS_LOCAL_POSITION
varying vGeometryPositionL: vec3f;
#endif
#ifdef PREPASS_DEPTH
varying vGeometryViewDepth: f32;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying vGeometryNormalizedViewDepth: f32;
#endif
#ifdef PREPASS_NORMAL
varying vGeometryNormalV: vec3f;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vGeometryNormalW: vec3f;
#endif
#if defined(PREPASS_ALBEDO) || defined(PREPASS_ALBEDO_SQRT)
varying vGeometryAlbedo: vec3f;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
varying vGeometryCurrentPosition: vec4f;
varying vGeometryPreviousPosition: vec4f;
#endif
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<gaussianSplattingFragmentDeclaration>

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

    var finalColor: vec4f = gaussianColor(input.vColor, input.vPosition);

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

#ifdef PREPASS
    if (finalColor.a <= 0.0 && uniforms.geometryZeroAlphaDiscard > 0.0) {
        discard;
    }
    let geometryColor = finalColor;
    #if defined(PREPASS_ALBEDO) || defined(PREPASS_ALBEDO_SQRT)
        let geometryAlbedo = input.vGeometryAlbedo;
    #endif
    #ifdef PREPASS_POSITION
        let geometryPositionW = input.vGeometryPositionW;
    #endif
    #ifdef PREPASS_LOCAL_POSITION
        let geometryPositionL = input.vGeometryPositionL;
    #endif
    #ifdef PREPASS_DEPTH
        let geometryViewDepth = input.vGeometryViewDepth;
    #endif
    #ifdef PREPASS_NORMALIZED_VIEW_DEPTH
        let geometryNormalizedViewDepth = input.vGeometryNormalizedViewDepth;
    #endif
    #ifdef PREPASS_NORMAL
        let geometryNormalV = input.vGeometryNormalV;
    #endif
    #ifdef PREPASS_WORLD_NORMAL
        let geometryNormalW = input.vGeometryNormalW;
    #endif
    #if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
        let geometryCurrentPosition = input.vGeometryCurrentPosition;
        let geometryPreviousPosition = input.vGeometryPreviousPosition;
    #endif
    #include<geometryRenderingFragment>
#elif defined(GPUPICKER_DEPTH)
    fragmentOutputs.fragData0 = finalColor;
    #ifdef GPUPICKER_PACK_DEPTH
    fragmentOutputs.fragData1 = pack(fragmentInputs.position.z);
    #else
    fragmentOutputs.fragData1 = vec4f(fragmentInputs.position.z, 0.0, 0.0, 1.0);
    #endif
#else
    fragmentOutputs.color = finalColor;
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}
