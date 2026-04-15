var voxel_storage: texture_storage_3d<r8unorm, write>;

varying vNormalizedPosition: vec3f;
varying vNormalizedCenterPosition: vec3f;
varying vAlpha: f32;
varying vPatchPosition: vec2f;
flat varying f_swizzle: i32;

fn gsVoxelPrngCanonical1d(co: f32) -> f32 {
    return fract(sin(co * 91.3458) * 47453.5453);
}

fn gsVoxelPrngCanonical2d(co: vec2f) -> f32 {
    return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn gsVoxelPrngCanonical3d(co: vec3f) -> f32 {
    return gsVoxelPrngCanonical2d(vec2f(co.x, co.y) + gsVoxelPrngCanonical1d(co.z));
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var normPos: vec3f = input.vNormalizedPosition;

    // Derive stepSize from the voxel grid resolution (assumed cube).
    let stepSize: f32 = 1.0 / f32(textureDimensions(voxel_storage).x);

    // distToCenter in swizzled normalized space (consistent with vNormalizedCenterPosition).
    let diff: vec3f = abs(input.vNormalizedCenterPosition - normPos);
    let distToCenter: f32 = max(max(diff.x, diff.y), diff.z);

    let gaussian: f32 = exp(-dot(input.vPatchPosition, input.vPatchPosition));
    let shadowingOpacity: f32 = clamp(
        select(gaussian, 1.0, distToCenter < stepSize) * input.vAlpha,
        0.0, 1.0
    );

    // Probabilistic discard: transparent splats only partially mark voxels.
    if (shadowingOpacity < 1.0 && shadowingOpacity < gsVoxelPrngCanonical3d(normPos / stepSize)) {
        discard;
    }

    // Un-swizzle normPos to recover original 3D coordinates for textureStore.
    var storePos: vec3f;
    switch (input.f_swizzle) {
        case 0: { storePos = normPos.zxy; break; }  // inverse of .yzx
        case 1: { storePos = normPos.yzx; break; }  // inverse of .zxy
        default: { storePos = normPos; break; }      // no swizzle
    }

    let size: vec3f = vec3f(textureDimensions(voxel_storage));
    textureStore(voxel_storage,
        vec3<i32>(i32(storePos.x * size.x), i32(storePos.y * size.y), i32(storePos.z * size.z)),
        vec4f(1.0, 1.0, 1.0, 1.0));

    fragmentOutputs.color = vec4f(0.0, 0.0, 0.0, 0.0);
}
