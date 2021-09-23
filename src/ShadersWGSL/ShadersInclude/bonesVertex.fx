#if NUM_BONE_INFLUENCERS > 0
	var influence : mat4x4<f32>;

#ifdef BONETEXTURE
	influence = readMatrixFromRawSampler(boneSampler, matricesIndices[0]) * matricesWeights[0];

	#if NUM_BONE_INFLUENCERS > 1
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices[1]) * matricesWeights[1];
	#endif	
	#if NUM_BONE_INFLUENCERS > 2
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices[2]) * matricesWeights[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 3
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices[3]) * matricesWeights[3];
	#endif	

	#if NUM_BONE_INFLUENCERS > 4
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra[0]) * matricesWeightsExtra[0];
	#endif	
	#if NUM_BONE_INFLUENCERS > 5
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra[1]) * matricesWeightsExtra[1];
	#endif	
	#if NUM_BONE_INFLUENCERS > 6
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra[2]) * matricesWeightsExtra[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 7
		influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra[3]) * matricesWeightsExtra[3];
	#endif	
#else	
	influence = uniforms.mBones[int(matricesIndices[0])] * matricesWeights[0];

	#if NUM_BONE_INFLUENCERS > 1
		influence = influence + uniforms.mBones[int(matricesIndices[1])] * matricesWeights[1];
	#endif	
	#if NUM_BONE_INFLUENCERS > 2
		influence = influence + uniforms.mBones[int(matricesIndices[2])] * matricesWeights[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 3
		influence = influence + uniforms.mBones[int(matricesIndices[3])] * matricesWeights[3];
	#endif	

	#if NUM_BONE_INFLUENCERS > 4
		influence = influence + uniforms.mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
	#endif	
	#if NUM_BONE_INFLUENCERS > 5
		influence = influence + uniforms.mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
	#endif	
	#if NUM_BONE_INFLUENCERS > 6
		influence = influence + uniforms.mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 7
		influence = influence + uniforms.mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
	#endif	
#endif

	finalWorld = finalWorld * influence;
#endif