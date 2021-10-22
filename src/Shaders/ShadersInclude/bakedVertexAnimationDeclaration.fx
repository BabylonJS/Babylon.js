#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
    uniform sampler2D bakedVertexAnimationTexture;
    uniform float bakedVertexAnimationTime;
    uniform float bakedVertexAnimationTextureWidthInverse;
    uniform float bakedVertexAnimationSingleFrameUVPer;

    #ifdef INSTANCES
        attribute vec4 bakedVertexAnimationSettings;
    #else
        uniform vec4 bakedVertexAnimationSettings;
    #endif

    #define inline
    mat4 readMatrixFromRawSamplerVAT(sampler2D smp, float index, float frame, float textureWidthInverse)
    {
        float offset = index * 4.0;
        float frameUV = frame * bakedVertexAnimationSingleFrameUVPer;
        vec4 m0 = texture2D(smp, vec2(textureWidthInverse * (offset + 0.5), frameUV));
        vec4 m1 = texture2D(smp, vec2(textureWidthInverse * (offset + 1.5), frameUV));
        vec4 m2 = texture2D(smp, vec2(textureWidthInverse * (offset + 2.5), frameUV));
        vec4 m3 = texture2D(smp, vec2(textureWidthInverse * (offset + 3.5), frameUV));
        return mat4(m0, m1, m2, m3);
    }
#endif