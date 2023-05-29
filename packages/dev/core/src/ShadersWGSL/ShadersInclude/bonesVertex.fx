#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
    #if NUM_BONE_INFLUENCERS > 0
        var influence : mat4x4<f32>;

    #ifdef BONETEXTURE
        influence = readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndices[0]) * vertexInputs.matricesWeights[0];

        #if NUM_BONE_INFLUENCERS > 1
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndices[1]) * vertexInputs.matricesWeights[1];
        #endif	
        #if NUM_BONE_INFLUENCERS > 2
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndices[2]) * vertexInputs.matricesWeights[2];
        #endif	
        #if NUM_BONE_INFLUENCERS > 3
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndices[3]) * vertexInputs.matricesWeights[3];
        #endif	

        #if NUM_BONE_INFLUENCERS > 4
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndicesExtra[0]) * vertexInputs.matricesWeightsExtra[0];
        #endif	
        #if NUM_BONE_INFLUENCERS > 5
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndicesExtra[1]) * vertexInputs.matricesWeightsExtra[1];
        #endif	
        #if NUM_BONE_INFLUENCERS > 6
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndicesExtra[2]) * vertexInputs.matricesWeightsExtra[2];
        #endif	
        #if NUM_BONE_INFLUENCERS > 7
            influence = influence + readMatrixFromRawSampler(boneSampler, vertexInputs.matricesIndicesExtra[3]) * vertexInputs.matricesWeightsExtra[3];
        #endif	
    #else	
        influence = uniforms.mBones[int(vertexInputs.matricesIndices[0])] * vertexInputs.matricesWeights[0];

        #if NUM_BONE_INFLUENCERS > 1
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndices[1])] * vertexInputs.matricesWeights[1];
        #endif	
        #if NUM_BONE_INFLUENCERS > 2
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndices[2])] * vertexInputs.matricesWeights[2];
        #endif	
        #if NUM_BONE_INFLUENCERS > 3
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndices[3])] * vertexInputs.matricesWeights[3];
        #endif	

        #if NUM_BONE_INFLUENCERS > 4
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndicesExtra[0])] * vertexInputs.matricesWeightsExtra[0];
        #endif	
        #if NUM_BONE_INFLUENCERS > 5
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndicesExtra[1])] * vertexInputs.matricesWeightsExtra[1];
        #endif	
        #if NUM_BONE_INFLUENCERS > 6
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndicesExtra[2])] * vertexInputs.matricesWeightsExtra[2];
        #endif	
        #if NUM_BONE_INFLUENCERS > 7
            influence = influence + uniforms.mBones[int(vertexInputs.matricesIndicesExtra[3])] * vertexInputs.matricesWeightsExtra[3];
        #endif	
    #endif

        finalWorld = finalWorld * influence;
    #endif
#endif