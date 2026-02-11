#include<sceneUboDeclaration>
#include<meshUboDeclaration>

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
uniform alpha: f32;

#if IS_COMPOUND
uniform partWorld: array<mat4x4<f32>, MAX_PART_COUNT>;
uniform partVisibility: array<f32, MAX_PART_COUNT>;
uniform partMeshID: array<f32, MAX_PART_COUNT>;
var partIndicesTexture: texture_2d<f32>;
#else
uniform meshID: f32;
#endif

// textures
var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;

varying vPosition: vec2f;
flat varying vMeshID: f32;

#include<gaussianSplatting>

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let splatIndex: f32 = getSplatIndex(i32(input.position.z + 0.5), input.splatIndex0, input.splatIndex1, input.splatIndex2, input.splatIndex3);

    var splat: Splat = readSplat(splatIndex, uniforms.dataTextureSize);
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.xy);

#if IS_COMPOUND
    let splatWorld: mat4x4f = getPartWorld(splat.partIndex);
    vertexOutputs.vMeshID = uniforms.partMeshID[splat.partIndex];

    // Hide invisible parts
    if (uniforms.partVisibility[splat.partIndex] <= 0.0) {
        vertexOutputs.position = vec4f(0.0, 0.0, 2.0, 1.0);
        return vertexOutputs;
    }
#else
    let splatWorld: mat4x4f = mesh.world;
    vertexOutputs.vMeshID = uniforms.meshID;
#endif

    let worldPos: vec4f = splatWorld * vec4f(splat.center.xyz, 1.0);
    vertexOutputs.vPosition = input.position.xy;

    // Hide fully transparent splats
    var splatAlpha: f32 = splat.color.w * uniforms.alpha;
#if IS_COMPOUND
    splatAlpha *= uniforms.partVisibility[splat.partIndex];
#endif
    if (splatAlpha <= 0.0) {
        vertexOutputs.position = vec4f(0.0, 0.0, 2.0, 1.0);
        return vertexOutputs;
    }

    vertexOutputs.position = gaussianSplatting(input.position.xy, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, splatWorld, scene.view, scene.projection, uniforms.focal, uniforms.invViewport, uniforms.kernelSize);
}
