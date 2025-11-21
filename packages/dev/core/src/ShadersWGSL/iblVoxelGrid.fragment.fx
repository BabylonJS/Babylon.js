var voxel_storage: texture_storage_3d<rgba8unorm, write>;
varying vNormalizedPosition: vec3f;
flat varying f_swizzle: i32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var size: vec3f = vec3f(textureDimensions(voxel_storage));
    var normPos: vec3f = input.vNormalizedPosition.xyz;
    var outputColor: vec4f = vec4f(0.0, 0.0, 0.0, 1.0);
    switch (input.f_swizzle) {
        case 0: {
            normPos = normPos.zxy; 
            outputColor = vec4f(1.0, 1.0, 0.0, 1.0);
            break;
        }
        case 1: {
            normPos = normPos.yzx;
            outputColor = vec4f(1.0, 1.0, 1.0, 1.0);
            break;
        }
        default: {
            normPos = normPos.xyz;
            outputColor = vec4f(1.0, 1.0, 0.0, 1.0);
            break;
        }
    }

    textureStore(voxel_storage, vec3<i32>(i32(normPos.x * size.x), i32(normPos.y * size.y), i32(normPos.z * size.z)), outputColor);
    fragmentOutputs.color = vec4<f32>(vec3<f32>(normPos), 1.);
}