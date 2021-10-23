#ifdef INSTANCES
    #define BVASNAME bakedVertexAnimationSettingsInstanced
#else
    #define BVASNAME bakedVertexAnimationSettings
#endif

#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
    // calculate the current frame for the VAT
    float VATStartFrame = BVASNAME.x;
    float VATEndFrame = BVASNAME.y;
    float VATOffsetFrame = BVASNAME.z;
    float VATSpeed = BVASNAME.w;

    // get number of frames
    float _numOfFrames = VATEndFrame - VATStartFrame + 1.0;
    // convert frame offset to secs elapsed
    float offsetCycle = VATOffsetFrame / VATSpeed;
    // add offset to time to get actual time, then
    // compute time elapsed in terms of frame cycle (30 fps/180 frames = 1/6 of an animation cycle per second)
    // so 0.5s = 0.08333 of an animation cycle, 7.5s = 1.25 of an animation cycle etc
    float VATFrameNum = fract((bakedVertexAnimationTime + offsetCycle) * VATSpeed / _numOfFrames);
    // convert to actual frame
    VATFrameNum *= _numOfFrames;
    // round it to integer
    VATFrameNum = ceil(VATFrameNum);
    // add to start frame
    VATFrameNum += VATStartFrame;

    mat4 VATInfluence;
    VATInfluence = readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[0], VATFrameNum) * matricesWeights[0];
    #if NUM_BONE_INFLUENCERS > 1
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[1], VATFrameNum) * matricesWeights[1];
    #endif
    #if NUM_BONE_INFLUENCERS > 2
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[2], VATFrameNum) * matricesWeights[2];
    #endif
    #if NUM_BONE_INFLUENCERS > 3
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[3], VATFrameNum) * matricesWeights[3];
    #endif
    #if NUM_BONE_INFLUENCERS > 4
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[0], VATFrameNum) * matricesWeightsExtra[0];
    #endif
    #if NUM_BONE_INFLUENCERS > 5
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[1], VATFrameNum) * matricesWeightsExtra[1];
    #endif
    #if NUM_BONE_INFLUENCERS > 6
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[2], VATFrameNum) * matricesWeightsExtra[2];
    #endif
    #if NUM_BONE_INFLUENCERS > 7
        VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[3], VATFrameNum) * matricesWeightsExtra[3];
    #endif

    finalWorld = finalWorld * VATInfluence;
}
#endif