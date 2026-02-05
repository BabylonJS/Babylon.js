#if NUM_BONE_INFLUENCERS > 0
    attribute vec4 matricesIndices;
    attribute vec4 matricesWeights;
    #if NUM_BONE_INFLUENCERS > 4
        attribute vec4 matricesIndicesExtra;
        attribute vec4 matricesWeightsExtra;
    #endif

    #ifndef BAKED_VERTEX_ANIMATION_TEXTURE
        #ifdef BONETEXTURE
            uniform highp sampler2D boneSampler;
            #if !defined(WEBGL2) && !defined(WEBGPU)
                uniform float boneTextureWidth;
            #endif
        #else
            uniform mat4 mBones[BonesPerMesh];
        #endif

        #ifdef BONES_VELOCITY_ENABLED
            uniform mat4 mPreviousBones[BonesPerMesh];
        #endif

        #ifdef BONETEXTURE
            #define inline
            mat4 readMatrixFromRawSampler(sampler2D smp, float index)
            {
                #if defined(WEBGL2) || defined(WEBGPU)
                    int offset = int(index)  * 4;	

                    vec4 m0 = texelFetch(smp, ivec2(offset + 0, 0), 0);
                    vec4 m1 = texelFetch(smp, ivec2(offset + 1, 0), 0);
                    vec4 m2 = texelFetch(smp, ivec2(offset + 2, 0), 0);
                    vec4 m3 = texelFetch(smp, ivec2(offset + 3, 0), 0);

                    return mat4(m0, m1, m2, m3);
                #else
                    float offset = index  * 4.0;
                    float dx = 1.0 / boneTextureWidth;

                    vec4 m0 = texture2D(smp, vec2(dx * (offset + 0.5), 0.));
                    vec4 m1 = texture2D(smp, vec2(dx * (offset + 1.5), 0.));
                    vec4 m2 = texture2D(smp, vec2(dx * (offset + 2.5), 0.));
                    vec4 m3 = texture2D(smp, vec2(dx * (offset + 3.5), 0.));

                    return mat4(m0, m1, m2, m3);
                #endif
            }
        #endif
    #endif
#endif