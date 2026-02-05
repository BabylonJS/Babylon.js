#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
    uniform float bakedVertexAnimationTime;
    #if !defined(WEBGL2) && !defined(WEBGPU)
        uniform vec2 bakedVertexAnimationTextureSizeInverted;
    #endif
    uniform vec4 bakedVertexAnimationSettings;
    uniform sampler2D bakedVertexAnimationTexture;

    #ifdef INSTANCES
        attribute vec4 bakedVertexAnimationSettingsInstanced;
    #endif

    #define inline
    mat4 readMatrixFromRawSamplerVAT(sampler2D smp, float index, float frame)
    {
        #if defined(WEBGL2) || defined(WEBGPU)
            int offset = int(index) * 4;
            int frameUV = int(frame);
            vec4 m0 = texelFetch(smp, ivec2(offset + 0, frameUV), 0);
            vec4 m1 = texelFetch(smp, ivec2(offset + 1, frameUV), 0);
            vec4 m2 = texelFetch(smp, ivec2(offset + 2, frameUV), 0);
            vec4 m3 = texelFetch(smp, ivec2(offset + 3, frameUV), 0);
            return mat4(m0, m1, m2, m3);
        #else
            float offset = index * 4.0;
            float frameUV = (frame + 0.5) * bakedVertexAnimationTextureSizeInverted.y;
            float dx = bakedVertexAnimationTextureSizeInverted.x;
            vec4 m0 = texture2D(smp, vec2(dx * (offset + 0.5), frameUV));
            vec4 m1 = texture2D(smp, vec2(dx * (offset + 1.5), frameUV));
            vec4 m2 = texture2D(smp, vec2(dx * (offset + 2.5), frameUV));
            vec4 m3 = texture2D(smp, vec2(dx * (offset + 3.5), frameUV));
            return mat4(m0, m1, m2, m3);
        #endif
    }
#endif