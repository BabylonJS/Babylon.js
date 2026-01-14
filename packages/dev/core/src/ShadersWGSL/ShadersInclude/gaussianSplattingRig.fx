#if USE_RIG

fn getRigNodeWorld(rigNodeIndex: u32) -> mat4x4<f32> {
    return uniforms.rigNodeWorld[rigNodeIndex];
}

#endif