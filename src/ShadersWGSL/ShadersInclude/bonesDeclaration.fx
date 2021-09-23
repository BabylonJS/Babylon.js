#if NUM_BONE_INFLUENCERS > 0
	#ifdef BONETEXTURE
		var boneSampler : texture_2d<f32>;
		uniform boneTextureWidth : f32;
	#else
		uniform mBones : array<mat4x4, BonesPerMesh>;
		#ifdef BONES_VELOCITY_ENABLED
		    uniform mPreviousBones : array<mat4x4, BonesPerMesh>;
		#endif
	#endif

	attribute matricesIndices : vec4<f32>;
	attribute matricesWeights : vec4<f32>;
	#if NUM_BONE_INFLUENCERS > 4
		attribute matricesIndicesExtra : vec4<f32>;
		attribute matricesWeightsExtra : vec4<f32>;
	#endif

	#ifdef BONETEXTURE
		fn readMatrixFromRawSampler(smp : texture_2d<f32>, index : f32) -> mat4x4<f32>
		{
			let offset = i32(index)  * 4;	

			let m0 = textureLoad(smp, vec2<i32>(offset + 0, 0), 0);
			let m1 = textureLoad(smp, vec2<i32>(offset + 1, 0), 0);
			let m2 = textureLoad(smp, vec2<i32>(offset + 2, 0), 0);
			let m3 = textureLoad(smp, vec2<i32>(offset + 3, 0), 0);

			return mat4x4<f32>(m0, m1, m2, m3);
		}
	#endif

#endif