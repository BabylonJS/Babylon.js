#if NUM_BONE_INFLUENCERS > 0
	attribute matricesIndices : vec4<f32>;
	attribute matricesWeights : vec4<f32>;
	#if NUM_BONE_INFLUENCERS > 4
		attribute matricesIndicesExtra : vec4<f32>;
		attribute matricesWeightsExtra : vec4<f32>;
	#endif

    #ifndef BAKED_VERTEX_ANIMATION_TEXTURE
        #ifdef BONETEXTURE
            var boneSamplerSampler : sampler;
            var boneSampler : texture_2d<f32>;
            uniform boneTextureWidth : f32;
        #else
            uniform mBones : array<mat4x4, BonesPerMesh>;
            #ifdef BONES_VELOCITY_ENABLED
                uniform mPreviousBones : array<mat4x4, BonesPerMesh>;
            #endif
        #endif

        #ifdef BONETEXTURE
            fn readMatrixFromRawSampler(smp : texture_2d<f32>, smpSampler: sampler, index : f32) -> mat4x4<f32>
            {
                let offset = index * 4;	
                let dx = 1.0 / uniforms.boneTextureWidth;

                let m0 = textureSampleLevel(smp, smpSampler, vec2f(dx * (offset + 0.5), 0.), 0.);
                let m1 = textureSampleLevel(smp, smpSampler, vec2f(dx * (offset + 1.5), 0.), 0.);
                let m2 = textureSampleLevel(smp, smpSampler, vec2f(dx * (offset + 2.5), 0.), 0.);
                let m3 = textureSampleLevel(smp, smpSampler, vec2f(dx * (offset + 3.5), 0.), 0.);

                return mat4x4<f32>(m0, m1, m2, m3);
            }
        #endif
    #endif
#endif