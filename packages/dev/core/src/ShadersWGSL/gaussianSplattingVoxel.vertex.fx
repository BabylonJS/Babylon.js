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
uniform axis: i32;

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
flat varying f_swizzle: i32;

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

    // Reconstruct rotation matrix (column-major) and per-axis scale from textures.
    let splatRotation = mat3x3f(
        splat.rotationA.xyz,
        vec3f(splat.rotationA.w, splat.rotationB.x, splat.rotationB.y),
        vec3f(splat.rotationB.z, splat.rotationB.w, splat.rotationScale.x)
    );
    let splatScale: vec3f = splat.rotationScale.yzw;
    let quadPos: vec2f = vertexInputs.position.xy;
    let cutoff: f32 = 0.7071067812; // 1/sqrt(2)

    // Span the quad in the two local splat axes orthogonal to the voxelization axis.
    // The normal for axis i is col[2-i] of splatRotation:
    //   axis=0 -> normal col[2] -> span col[0],col[1] (local XY)
    //   axis=1 -> normal col[1] -> span col[0],col[2] (local XZ)
    //   axis=2 -> normal col[0] -> span col[1],col[2] (local YZ)
    var offsetSplatSpace: vec3f;
    switch (uniforms.axis) {
        case 0: { offsetSplatSpace = vec3f(quadPos.x * splatScale.x, quadPos.y * splatScale.y, 0.0); break; }
        case 1: { offsetSplatSpace = vec3f(quadPos.x * splatScale.x, 0.0, quadPos.y * splatScale.z); break; }
        default: { offsetSplatSpace = vec3f(0.0, quadPos.x * splatScale.y, quadPos.y * splatScale.z); break; }
    }
    offsetSplatSpace *= cutoff;

    let vertexPos: vec3f = splat.center.xyz + splatRotation * offsetSplatSpace;
    let worldPos: vec4f = splatWorld * vec4f(vertexPos, 1.0);

    // Normalize to [-1, 1] using invWorldScale.
    var normPos: vec3f = (uniforms.invWorldScale * worldPos).xyz;

    // Swizzle so the voxelization-axis direction becomes Z (depth in clip space):
    //   axis=0 -> normal along Z -> no swizzle      (f_swizzle=2)
    //   axis=1 -> normal along Y -> swizzle .zxy    (f_swizzle=1, Y becomes Z)
    //   axis=2 -> normal along X -> swizzle .yzx    (f_swizzle=0, X becomes Z)
    var swizzle: i32;
    switch (uniforms.axis) {
        case 0: { swizzle = 2; break; }
        case 1: { normPos = normPos.zxy; swizzle = 1; break; }
        default: { normPos = normPos.yzx; swizzle = 0; break; }
    }
    vertexOutputs.f_swizzle = swizzle;

    // Map Z from [-1,1] to [0,1] for WebGPU depth range.
    let normZ: f32 = normPos.z * 0.5 + 0.5;
    vertexOutputs.position = vec4f(normPos.x, normPos.y, normZ, 1.0);
    vertexOutputs.vNormalizedPosition = vec3f(normPos.x * 0.5 + 0.5, normPos.y * 0.5 + 0.5, normZ);

    // Center position with the same swizzle, for distToCenter in the fragment.
    var centerNorm: vec3f = (uniforms.invWorldScale * splatWorld * vec4f(splat.center.xyz, 1.0)).xyz;
    switch (uniforms.axis) {
        case 0: {}
        case 1: { centerNorm = centerNorm.zxy; break; }
        default: { centerNorm = centerNorm.yzx; break; }
    }
    vertexOutputs.vNormalizedCenterPosition = centerNorm * 0.5 + 0.5;

    vertexOutputs.vAlpha = splat.color.w * uniforms.alpha;
#if IS_COMPOUND
    vertexOutputs.vAlpha *= uniforms.partVisibility[splat.partIndex];
#endif

    vertexOutputs.vPatchPosition = quadPos;
}
