#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#include<helperFunctions>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

// Attributes
attribute splatIndex0: vec4f;
attribute splatIndex1: vec4f;
attribute splatIndex2: vec4f;
attribute splatIndex3: vec4f;
attribute position: vec3f;

// Uniforms
uniform invViewport: vec2f;
uniform dataTextureSize: vec2f;
uniform focal: vec2f;
uniform kernelSize: f32;
uniform minPixelSize: f32;
uniform eyePosition: vec3f;
uniform alpha: f32;

#ifdef PREPASS
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
uniform previousWorld: mat4x4f;
uniform previousViewProjection: mat4x4f;
#if IS_COMPOUND
uniform previousPartWorld: array<mat4x4<f32>, MAX_PART_COUNT>;
#endif
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
uniform geometryDepthRange: vec2f;
#endif
#endif

#if IS_COMPOUND
uniform partWorld: array<mat4x4<f32>, MAX_PART_COUNT>;
uniform partVisibility: array<f32, MAX_PART_COUNT>;
#endif

// textures
var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;

#ifdef USE_SOG
var sogQuatsTexture: texture_2d<f32>;
uniform sogMeansMin: vec3f;
uniform sogMeansMax: vec3f;
#ifdef USE_SOG_V2
var sogCodebookTexture: texture_2d<f32>;
#else
uniform sogScalesMin: vec3f;
uniform sogScalesMax: vec3f;
uniform sogSh0Min: vec4f;
uniform sogSh0Max: vec4f;
uniform sogShnMin: f32;
uniform sogShnMax: f32;
#endif
#if SH_DEGREE > 0
var sogShNCentroidsTexture: texture_2d<f32>;
var sogShNLabelsTexture: texture_2d<f32>;
uniform sogShCoeffCount: f32;
#endif
#endif

#if SH_DEGREE > 0 && !defined(USE_SOG)
var shTexture0: texture_2d<u32>;
#endif
#if SH_DEGREE > 1 && !defined(USE_SOG)
var shTexture1: texture_2d<u32>;
#endif
#if SH_DEGREE > 2 && !defined(USE_SOG)
var shTexture2: texture_2d<u32>;
#endif
#if SH_DEGREE > 3 && !defined(USE_SOG)
var shTexture3: texture_2d<u32>;
var shTexture4: texture_2d<u32>;
#endif
#if IS_COMPOUND
var partIndicesTexture: texture_2d<f32>;
#endif
// Output
varying vColor: vec4f;
varying vPosition: vec2f;

#ifdef PREPASS
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

#define CUSTOM_VERTEX_DEFINITIONS

#include<gaussianSplatting>

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN

    let splatIndex: f32 = getSplatIndex(i32(vertexInputs.position.z + 0.5), vertexInputs.splatIndex0, vertexInputs.splatIndex1, vertexInputs.splatIndex2, vertexInputs.splatIndex3);

    var splat: Splat = readSplat(splatIndex, uniforms.dataTextureSize);
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.xy);

#if IS_COMPOUND
    // In case of compound, each splat may have a different world transform, depending on the part it belongs to
    let splatWorld: mat4x4f = getPartWorld(splat.partIndex);
#else
    let splatWorld: mat4x4f = mesh.world;
#endif

    let worldPos: vec4f = splatWorld * vec4f(splat.center.xyz, 1.0);

    vertexOutputs.vPosition = vertexInputs.position.xy;

#if defined(PREPASS_ALBEDO) || defined(PREPASS_ALBEDO_SQRT)
    vertexOutputs.vGeometryAlbedo = splat.color.xyz;
#endif

#if SH_DEGREE > 0
    let worldRot: mat3x3f =  mat3x3f(splatWorld[0].xyz, splatWorld[1].xyz, splatWorld[2].xyz);
    let normWorldRot: mat3x3f = inverseMat3(worldRot);

    var eyeToSplatLocalSpace: vec3f = normalize(normWorldRot * (worldPos.xyz - uniforms.eyePosition.xyz));
    #if defined(GS_DBG_ENABLED) && IS_COMPOUND
    {
        let _row3 = textureLoad(dbgPartData, vec2i(i32(splat.partIndex), 3), 0);
        #if SH_DEGREE > 3
            let _so4 = textureLoad(dbgPartData, vec2i(i32(splat.partIndex), 4), 0).x;
        #else
            let _so4: f32 = 1.0;
        #endif
        vertexOutputs.vColor = vec4f(_row3.x * splat.color.xyz + computeSHWeighted(splat, eyeToSplatLocalSpace, _row3.y, _row3.z, _row3.w, _so4), splat.color.w * uniforms.alpha);
    }
    #elif defined(GS_DBG_ENABLED) && GS_DBG_SH_DC == 0
        vertexOutputs.vColor = vec4f(computeSH(splat, eyeToSplatLocalSpace), splat.color.w * uniforms.alpha);
    #else
        vertexOutputs.vColor = vec4f(splat.color.xyz + computeSH(splat, eyeToSplatLocalSpace), splat.color.w * uniforms.alpha);
    #endif
#else
    #if defined(GS_DBG_ENABLED) && IS_COMPOUND
    {
        let _shDc = textureLoad(dbgPartData, vec2i(i32(splat.partIndex), 3), 0).x;
        vertexOutputs.vColor = vec4f(_shDc * splat.color.xyz, splat.color.w * uniforms.alpha);
    }
    #elif defined(GS_DBG_ENABLED) && GS_DBG_SH_DC == 0
        vertexOutputs.vColor = vec4f(0.0, 0.0, 0.0, splat.color.w * uniforms.alpha);
    #else
        vertexOutputs.vColor = vec4f(splat.color.xyz, splat.color.w * uniforms.alpha);
    #endif
#endif

#if IS_COMPOUND
    // Apply part visibility (0.0 to 1.0) to alpha
    vertexOutputs.vColor.w *= uniforms.partVisibility[splat.partIndex];
#endif

    var scale: vec2f = vec2f(1., 1.);

#define CUSTOM_VERTEX_UPDATE

    vertexOutputs.position = gaussianSplatting(vertexInputs.position.xy, worldPos.xyz, scale, covA, covB, splatWorld, scene.view, scene.projection, uniforms.focal, uniforms.invViewport, uniforms.kernelSize, uniforms.minPixelSize);

#ifdef PREPASS
#if defined(PREPASS_POSITION) || defined(PREPASS_LOCAL_POSITION) || defined(PREPASS_DEPTH) || defined(PREPASS_NORMALIZED_VIEW_DEPTH) || defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    let geometrySplatViewPosition = (scene.view * worldPos).xyz;
    let viewRotation = mat3x3f(scene.view[0].xyz, scene.view[1].xyz, scene.view[2].xyz);
#endif
#if defined(PREPASS_POSITION) || defined(PREPASS_LOCAL_POSITION) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    var geometryPlaneViewPosition = scene.inverseProjection * vertexOutputs.position;
    geometryPlaneViewPosition /= geometryPlaneViewPosition.w;
    let geometryPlanePositionW = worldPos.xyz + transpose(viewRotation) * (geometryPlaneViewPosition.xyz - geometrySplatViewPosition);
    #if defined(PREPASS_LOCAL_POSITION) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
        let splatWorldRotation = mat3x3f(splatWorld[0].xyz, splatWorld[1].xyz, splatWorld[2].xyz);
        let geometryPlanePositionL = splat.center.xyz + inverseMat3(splatWorldRotation) * (geometryPlanePositionW - worldPos.xyz);
    #endif
#endif
#ifdef PREPASS_POSITION
    vertexOutputs.vGeometryPositionW = geometryPlanePositionW;
#endif
#ifdef PREPASS_LOCAL_POSITION
    vertexOutputs.vGeometryPositionL = geometryPlanePositionL;
#endif
#ifdef PREPASS_DEPTH
    vertexOutputs.vGeometryViewDepth = geometrySplatViewPosition.z;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    vertexOutputs.vGeometryNormalizedViewDepth = (geometrySplatViewPosition.z - uniforms.geometryDepthRange.x) / (uniforms.geometryDepthRange.y - uniforms.geometryDepthRange.x);
#endif
#if defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL)
    // Gaussian splats do not define a surface normal, so use the rendered camera-facing plane normal.
    let geometryNormalV = vec3f(0.0, 0.0, select(-1.0, 1.0, geometrySplatViewPosition.z < 0.0));
    let geometryNormalW = normalize(transpose(viewRotation) * geometryNormalV);
    #ifdef PREPASS_NORMAL
        vertexOutputs.vGeometryNormalV = geometryNormalV;
    #endif
    #ifdef PREPASS_WORLD_NORMAL
        vertexOutputs.vGeometryNormalW = geometryNormalW;
    #endif
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    vertexOutputs.vGeometryCurrentPosition = vertexOutputs.position;
    #if IS_COMPOUND
        vertexOutputs.vGeometryPreviousPosition = uniforms.previousViewProjection * uniforms.previousPartWorld[splat.partIndex] * vec4f(geometryPlanePositionL, 1.0);
    #else
        vertexOutputs.vGeometryPreviousPosition = uniforms.previousViewProjection * uniforms.previousWorld * vec4f(geometryPlanePositionL, 1.0);
    #endif
#endif
#endif

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END
}
