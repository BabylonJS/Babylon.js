#include<__decl__gaussianSplattingVertex>

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#include<helperFunctions>

// Uniforms
uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;
uniform float minPixelSize;
uniform vec3 eyePosition;
uniform float alpha;

#ifdef PREPASS
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
uniform mat4 previousWorld;
uniform mat4 previousViewProjection;
#if IS_COMPOUND
uniform mat4 previousPartWorld[MAX_PART_COUNT];
#endif
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
uniform vec2 geometryDepthRange;
#endif
#endif

#if IS_COMPOUND
uniform mat4 partWorld[MAX_PART_COUNT];
uniform float partVisibility[MAX_PART_COUNT];
#endif

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

#ifdef USE_SOG
uniform sampler2D sogQuatsTexture;
uniform vec3 sogMeansMin;
uniform vec3 sogMeansMax;
#ifdef USE_SOG_V2
uniform sampler2D sogCodebookTexture; // 768x1 R32F, packed [scales|sh0|shN]
#else
uniform vec3 sogScalesMin;
uniform vec3 sogScalesMax;
uniform vec4 sogSh0Min;
uniform vec4 sogSh0Max;
uniform float sogShnMin;
uniform float sogShnMax;
#endif
#if SH_DEGREE > 0
uniform sampler2D sogShNCentroidsTexture;
uniform sampler2D sogShNLabelsTexture;
uniform float sogShCoeffCount;
#endif
#endif

#if SH_DEGREE > 0 && !defined(USE_SOG)
uniform highp usampler2D shTexture0;
#endif
#if SH_DEGREE > 1 && !defined(USE_SOG)
uniform highp usampler2D shTexture1;
#endif
#if SH_DEGREE > 2 && !defined(USE_SOG)
uniform highp usampler2D shTexture2;
#endif
#if SH_DEGREE > 3 && !defined(USE_SOG)
uniform highp usampler2D shTexture3;
uniform highp usampler2D shTexture4;
#endif

#if IS_COMPOUND
uniform sampler2D partIndicesTexture;
#endif

// Output
varying vec4 vColor;
varying vec2 vPosition;

#ifdef PREPASS
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

#define CUSTOM_VERTEX_DEFINITIONS

#include<gaussianSplatting>

void main () {
#define CUSTOM_VERTEX_MAIN_BEGIN

    float splatIndex = getSplatIndex(int(position.z + 0.5));
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);

#if IS_COMPOUND
    // In case of compound, each splat may have a different world transform, depending on the part it belongs to
    mat4 splatWorld = getPartWorld(splat.partIndex);
#else
    mat4 splatWorld = world;
#endif

    vec4 worldPos = splatWorld * vec4(splat.center.xyz, 1.0);

    vColor = splat.color;
    vPosition = position.xy;

#if defined(PREPASS_ALBEDO) || defined(PREPASS_ALBEDO_SQRT)
    vGeometryAlbedo = splat.color.xyz;
#endif

#if SH_DEGREE > 0
    mat3 worldRot = mat3(splatWorld);
    mat3 normWorldRot = inverseMat3(worldRot);

    vec3 eyeToSplatLocalSpace = normalize(normWorldRot * (worldPos.xyz - eyePosition));
    #if defined(GS_DBG_ENABLED) && IS_COMPOUND
    {
        vec4 _row3 = texelFetch(dbgPartData, ivec2(int(splat.partIndex), 3), 0);
        #if SH_DEGREE > 3
            float _so4 = texelFetch(dbgPartData, ivec2(int(splat.partIndex), 4), 0).x;
        #else
            float _so4 = 1.0;
        #endif
        vColor.xyz = _row3.x * splat.color.xyz + computeSHWeighted(splat, eyeToSplatLocalSpace, _row3.y, _row3.z, _row3.w, _so4);
    }
    #elif defined(GS_DBG_ENABLED) && GS_DBG_SH_DC == 0
        vColor.xyz = computeSH(splat, eyeToSplatLocalSpace);
    #else
        vColor.xyz = splat.color.xyz + computeSH(splat, eyeToSplatLocalSpace);
    #endif
#else
    #if defined(GS_DBG_ENABLED) && IS_COMPOUND
    {
        float _shDc = texelFetch(dbgPartData, ivec2(int(splat.partIndex), 3), 0).x;
        vColor.xyz = _shDc * splat.color.xyz;
    }
    #elif defined(GS_DBG_ENABLED) && GS_DBG_SH_DC == 0
        vColor.xyz = vec3(0.0);
    #endif
#endif

    vColor.w *= alpha;

#if IS_COMPOUND
    // Apply part visibility (0.0 to 1.0) to alpha
    vColor.w *= partVisibility[splat.partIndex];
#endif

    vec2 scale = vec2(1., 1.);

#define CUSTOM_VERTEX_UPDATE

    gl_Position = gaussianSplatting(position.xy, worldPos.xyz, scale, covA, covB, splatWorld, view, projection);

#ifdef PREPASS
#if defined(PREPASS_POSITION) || defined(PREPASS_LOCAL_POSITION) || defined(PREPASS_DEPTH) || defined(PREPASS_NORMALIZED_VIEW_DEPTH) || defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    vec3 geometrySplatViewPosition = (view * worldPos).xyz;
    vec4 geometryPlaneViewPosition = inverseProjection * gl_Position;
    geometryPlaneViewPosition /= geometryPlaneViewPosition.w;
    vec3 geometryPlanePositionW = worldPos.xyz + transpose(mat3(view)) * (geometryPlaneViewPosition.xyz - geometrySplatViewPosition);
    vec3 geometryPlanePositionL = splat.center.xyz + inverseMat3(mat3(splatWorld)) * (geometryPlanePositionW - worldPos.xyz);
#endif
#ifdef PREPASS_POSITION
    vGeometryPositionW = geometryPlanePositionW;
#endif
#ifdef PREPASS_LOCAL_POSITION
    vGeometryPositionL = geometryPlanePositionL;
#endif
#ifdef PREPASS_DEPTH
    vGeometryViewDepth = geometryPlaneViewPosition.z;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    vGeometryNormalizedViewDepth = (geometryPlaneViewPosition.z - geometryDepthRange.x) / (geometryDepthRange.y - geometryDepthRange.x);
#endif
#if defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL)
    // Gaussian splats do not define a surface normal, so use the rendered camera-facing plane normal.
    vec3 geometryNormalV = vec3(0.0, 0.0, geometrySplatViewPosition.z < 0.0 ? 1.0 : -1.0);
    vec3 geometryNormalW = normalize(transpose(mat3(view)) * geometryNormalV);
    #ifdef PREPASS_NORMAL
        vGeometryNormalV = geometryNormalV;
    #endif
    #ifdef PREPASS_WORLD_NORMAL
        vGeometryNormalW = geometryNormalW;
    #endif
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    vGeometryCurrentPosition = gl_Position;
    #if IS_COMPOUND
        vGeometryPreviousPosition = previousViewProjection * previousPartWorld[splat.partIndex] * vec4(geometryPlanePositionL, 1.0);
    #else
        vGeometryPreviousPosition = previousViewProjection * previousWorld * vec4(geometryPlanePositionL, 1.0);
    #endif
#endif
#endif

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END
}
