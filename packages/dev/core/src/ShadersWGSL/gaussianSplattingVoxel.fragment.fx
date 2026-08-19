// voxel_storage is kept bound only to source the grid resolution via textureDimensions; the grid
// texture itself is written later by the buffer->grid copy compute pass, not here.
var voxel_storage: texture_storage_3d<r8unorm, write>;
// Per-voxel opacity accumulator (packed: 4 voxels per u32). We atomicMax the quantized opacity so
// overlapping splats (and the three per-axis passes) keep the strongest occluder, since storage
// textures can't blend/atomic.
var<storage, read_write> voxelOpacityBuffer: array<atomic<u32>>;
#include<iblVoxelOpacityAtomicMax>

varying vNormalizedPosition: vec3f;
varying vNormalizedCenterPosition: vec3f;
varying vAlpha: f32;
varying vPatchPosition: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let normPos: vec3f = input.vNormalizedPosition;

    let size: vec3<u32> = textureDimensions(voxel_storage);
    // Derive stepSize from the voxel grid resolution (assumed cube).
    let stepSize: f32 = 1.0 / f32(size.x);

    // distToCenter in voxel-grid normalized space [0,1].
    let diff: vec3f = abs(input.vNormalizedCenterPosition - normPos);
    let distToCenter: f32 = max(max(diff.x, diff.y), diff.z);

    // Per-fragment coverage of the voxel cell times the splat's transparency. We store this
    // non-binary opacity (no bake-time roulette); the Russian-roulette is deferred to the shadow
    // ray-march so it can vary per sample and converge to the correct transmittance.
    let gaussian: f32 = exp(-dot(input.vPatchPosition, input.vPatchPosition));
    let shadowingOpacity: f32 = clamp(
        select(gaussian, 1.0, distToCenter < stepSize) * input.vAlpha,
        0.0, 1.0
    );

    if (shadowingOpacity <= 0.0) {
        discard;
    }

    let coord: vec3<u32> = min(
        vec3<u32>(u32(normPos.x * f32(size.x)), u32(normPos.y * f32(size.y)), u32(normPos.z * f32(size.z))),
        size - vec3<u32>(1u));
    let vidx: u32 = coord.x + coord.y * size.x + coord.z * size.x * size.y;
    voxelOpacityAtomicMax(vidx, u32(shadowingOpacity * 255.0 + 0.5));

    fragmentOutputs.color = vec4f(0.0, 0.0, 0.0, 0.0);
}
