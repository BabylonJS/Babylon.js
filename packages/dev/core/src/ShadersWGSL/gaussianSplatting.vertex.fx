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
uniform eyePosition: vec3f;
uniform alpha: f32;

#if IS_COMPOUND
uniform partWorld: array<mat4x4<f32>, MAX_PART_COUNT>;
uniform partVisibility: array<f32, MAX_PART_COUNT>;
#endif

// textures
var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;
#if SH_DEGREE > 0
var shTexture0: texture_2d<u32>;
#endif
#if SH_DEGREE > 1
var shTexture1: texture_2d<u32>;
#endif
#if SH_DEGREE > 2
var shTexture2: texture_2d<u32>;
#endif
#if IS_COMPOUND
var partIndicesTexture: texture_2d<f32>;
#endif
// Output
varying vColor: vec4f;
varying vPosition: vec2f;

#include<gaussianSplatting>

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

    let splatIndex: f32 = getSplatIndex(i32(input.position.z + 0.5), input.splatIndex0, input.splatIndex1, input.splatIndex2, input.splatIndex3);

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

    vertexOutputs.vPosition = input.position.xy;

#if SH_DEGREE > 0
    let worldRot: mat3x3f =  mat3x3f(splatWorld[0].xyz, splatWorld[1].xyz, splatWorld[2].xyz);
    let normWorldRot: mat3x3f = inverseMat3(worldRot);

    var eyeToSplatLocalSpace: vec3f = normalize(normWorldRot * (worldPos.xyz - uniforms.eyePosition.xyz));
    vertexOutputs.vColor = vec4f(splat.color.xyz + computeSH(splat, eyeToSplatLocalSpace), splat.color.w * uniforms.alpha);
#else
    vertexOutputs.vColor = vec4f(splat.color.xyz, splat.color.w * uniforms.alpha);
#endif

#if IS_COMPOUND
    // Apply part visibility (0.0 to 1.0) to alpha
    vertexOutputs.vColor.w *= uniforms.partVisibility[splat.partIndex];
#endif

    vertexOutputs.position = gaussianSplatting(input.position.xy, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, splatWorld, scene.view, scene.projection, uniforms.focal, uniforms.invViewport, uniforms.kernelSize);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
