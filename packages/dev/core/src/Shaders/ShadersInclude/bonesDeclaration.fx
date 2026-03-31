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
            uniform vec2 boneTextureInfo;
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
                    int offset = int(index) * 4;	
                    int textureWidth = int(boneTextureInfo.x);
                    int y = int(offset) / textureWidth;
                    int x = int(offset) % textureWidth;

                    vec4 m0 = texelFetch(smp, ivec2(x + 0, y), 0);
                    vec4 m1 = texelFetch(smp, ivec2(x + 1, y), 0);
                    vec4 m2 = texelFetch(smp, ivec2(x + 2, y), 0);
                    vec4 m3 = texelFetch(smp, ivec2(x + 3, y), 0);

                    return mat4(m0, m1, m2, m3);
                #else
                    float offset = index * 4.0;
                    float y = floor(offset / boneTextureInfo.x);
                    float x = offset - y * boneTextureInfo.x;
                    float dy = 1.0 / boneTextureInfo.y;
                    float dx = 1.0 / boneTextureInfo.x;

                    vec4 m0 = texture2D(smp, vec2(dx * (x + 0.5), dy * (y + 0.5)));
                    vec4 m1 = texture2D(smp, vec2(dx * (x + 1.5), dy * (y + 0.5)));
                    vec4 m2 = texture2D(smp, vec2(dx * (x + 2.5), dy * (y + 0.5)));
                    vec4 m3 = texture2D(smp, vec2(dx * (x + 3.5), dy * (y + 0.5))); 

                    return mat4(m0, m1, m2, m3);
                #endif
            }
        #endif
    #endif
#endif