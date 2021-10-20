#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
    uniform sampler2D bakedVertexAnimationTexture;
    uniform float bakedVertexAnimationTime;
    uniform float bakedVertexAnimationSingleFrameUVPer;

    attribute vec4 bakedVertexAnimationSettings;

    #define inline
    mat4 readMatrixFromRawSamplerVAT(sampler2D smp, float index, float frame, float bTW)
    {
        float offset = index * 4.0;
        float dx = 1.0 / bTW;
        float frameUV = frame * bakedVertexAnimationSingleFrameUVPer;
        vec4 m0 = texture2D(smp, vec2(dx * (offset + 0.5), frameUV));
        vec4 m1 = texture2D(smp, vec2(dx * (offset + 1.5), frameUV));
        vec4 m2 = texture2D(smp, vec2(dx * (offset + 2.5), frameUV));
        vec4 m3 = texture2D(smp, vec2(dx * (offset + 3.5), frameUV));
        return mat4(m0, m1, m2, m3);
    }
#endif