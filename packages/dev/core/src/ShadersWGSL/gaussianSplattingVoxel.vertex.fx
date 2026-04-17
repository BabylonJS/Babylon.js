#include<sceneUboDeclaration>
#include<meshUboDeclaration>

// Attributes
attribute splatIndex0: vec4f;
attribute splatIndex1: vec4f;
attribute splatIndex2: vec4f;
attribute splatIndex3: vec4f;
attribute position: vec3f;

// Uniforms
uniform dataTextureSize: vec2f;
uniform alpha: f32;
uniform invWorldScale: mat4x4f;
uniform viewMatrix: mat4x4f;

#if IS_COMPOUND
uniform partWorld: array<mat4x4<f32>, MAX_PART_COUNT>;
uniform partVisibility: array<f32, MAX_PART_COUNT>;
#endif

// Textures
var rotationsATexture: texture_2d<f32>;
var rotationsBTexture: texture_2d<f32>;
var rotationScaleTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;
#if IS_COMPOUND
var partIndicesTexture: texture_2d<f32>;
#endif

// Varyings
varying vNormalizedPosition: vec3f;
varying vNormalizedCenterPosition: vec3f;
varying vAlpha: f32;
varying vPatchPosition: vec2f;

#include<gaussianSplatting>

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let splatIndex: f32 = getSplatIndex(
        i32(vertexInputs.position.z + 0.5),
        vertexInputs.splatIndex0, vertexInputs.splatIndex1,
        vertexInputs.splatIndex2, vertexInputs.splatIndex3
    );
    var splat: Splat = readSplat(splatIndex, uniforms.dataTextureSize);

#if IS_COMPOUND
    let splatWorld: mat4x4f = getPartWorld(splat.partIndex);
#else
    let splatWorld: mat4x4f = mesh.world;
#endif

    let quadPos: vec2f = vertexInputs.position.xy;
    let worldPos: vec4f = computeVoxelSplatWorldPos(splat.rotationA, splat.rotationB, splat.rotationScale, splat.center.xyz, splatWorld, uniforms.viewMatrix, uniforms.invWorldScale, quadPos);

    // Original normalized position in voxel-grid space [0,1] for textureStore in the fragment.
    vertexOutputs.vNormalizedPosition = (uniforms.invWorldScale * worldPos).xyz * 0.5 + 0.5;

    // Clip position: viewMatrix rotates the voxelization axis to become Z (depth).
    let clipPos: vec4f = uniforms.viewMatrix * uniforms.invWorldScale * worldPos;
    // Map Z from [-1,1] to [0,1] for WebGPU depth range.
    vertexOutputs.position = vec4f(clipPos.x, clipPos.y, clipPos.z * 0.5 + 0.5, 1.0);

    vertexOutputs.vNormalizedCenterPosition = (uniforms.invWorldScale * splatWorld * vec4f(splat.center.xyz, 1.0)).xyz * 0.5 + 0.5;

    vertexOutputs.vAlpha = splat.color.w * uniforms.alpha;
#if IS_COMPOUND
    vertexOutputs.vAlpha *= uniforms.partVisibility[splat.partIndex];
#endif

    vertexOutputs.vPatchPosition = quadPos;
}
