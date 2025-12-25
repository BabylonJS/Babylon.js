#if NUM_BONE_INFLUENCERS > 0
	attribute matricesIndices : vec4f;
	attribute matricesWeights : vec4f;
	#if NUM_BONE_INFLUENCERS > 4
		attribute matricesIndicesExtra : vec4f;
		attribute matricesWeightsExtra : vec4f;
	#endif

    #ifndef BAKED_VERTEX_ANIMATION_TEXTURE
        #ifdef BONETEXTURE
            var boneSampler : texture_2d<f32>;
            uniform boneTextureWidth : f32;
        #else
            uniform mBones : array<mat4x4f, BonesPerMesh>;
        #endif

        #ifdef BONES_VELOCITY_ENABLED
            uniform mPreviousBones : array<mat4x4f, BonesPerMesh>;
        #endif

        #ifdef BONETEXTURE
            fn readMatrixFromRawSampler(smp : texture_2d<f32>, index : f32) -> mat4x4f
            {
                let offset = i32(index)  * 4;	

                let m0 = textureLoad(smp, vec2<i32>(offset + 0, 0), 0);
                let m1 = textureLoad(smp, vec2<i32>(offset + 1, 0), 0);
                let m2 = textureLoad(smp, vec2<i32>(offset + 2, 0), 0);
                let m3 = textureLoad(smp, vec2<i32>(offset + 3, 0), 0);

                return mat4x4f(m0, m1, m2, m3);
            }
        #endif
    #endif
#endif