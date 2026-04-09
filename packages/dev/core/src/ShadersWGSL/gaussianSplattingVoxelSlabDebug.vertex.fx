#include<sceneUboDeclaration>
#include<meshUboDeclaration>

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
var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;
#if IS_COMPOUND
var partIndicesTexture: texture_2d<f32>;
#endif

// Varyings
varying vNormalizedPosition: vec3f;
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
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.x, splat.covB.y);

#if IS_COMPOUND
    let splatWorld: mat4x4f = getPartWorld(splat.partIndex);
#else
    let splatWorld: mat4x4f = mesh.world;
#endif

    // Screen-space quad position using the camera view/projection (from the scene UBO).
    let worldPosGS: vec4f = splatWorld * vec4f(splat.center.xyz, 1.0);
    vertexOutputs.position = gaussianSplatting(
        vertexInputs.position.xy, worldPosGS.xyz, vec2f(1.0, 1.0),
        covA, covB, splatWorld, scene.view, scene.projection,
        uniforms.focal, uniforms.invViewport, uniforms.kernelSize
    );

    // Voxel-space position using the per-axis viewMatrix + invWorldScale.
    let worldPos: vec4f = computeVoxelSplatWorldPos(
        splat.rotationA, splat.rotationB, splat.rotationScale,
        splat.center.xyz, splatWorld, uniforms.viewMatrix, uniforms.invWorldScale,
        vertexInputs.position.xy
    );
    let viewPos: vec4f = uniforms.viewMatrix * uniforms.invWorldScale * worldPos;
    vertexOutputs.vNormalizedPosition = viewPos.xyz * 0.5 + 0.5;

    vertexOutputs.vAlpha = splat.color.w * uniforms.alpha;
#if IS_COMPOUND
    vertexOutputs.vAlpha *= uniforms.partVisibility[splat.partIndex];
#endif

    vertexOutputs.vPatchPosition = vertexInputs.position.xy;
}
