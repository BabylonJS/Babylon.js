#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
    uniform bakedVertexAnimationTime: f32;
    uniform bakedVertexAnimationSettings: vec4<f32>;
    var bakedVertexAnimationTexture : texture_2d<f32>;

    #ifdef INSTANCES
        attribute bakedVertexAnimationSettingsInstanced : vec4<f32>;
    #endif

    fn readMatrixFromRawSamplerVAT(smp : texture_2d<f32>, index : f32, frame : f32) -> mat4x4<f32>
    {
        let offset = i32(index) * 4;
        let frameUV = i32(frame);
        let m0 = textureLoad(smp, vec2<i32>(offset + 0, frameUV), 0);
        let m1 = textureLoad(smp, vec2<i32>(offset + 1, frameUV), 0);
        let m2 = textureLoad(smp, vec2<i32>(offset + 2, frameUV), 0);
        let m3 = textureLoad(smp, vec2<i32>(offset + 3, frameUV), 0);
        return mat4x4<f32>(m0, m1, m2, m3);
    }
#endif