#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
    #ifdef INSTANCES
        #define BVASNAME bakedVertexAnimationSettingsInstanced
    #else
        #define BVASNAME bakedVertexAnimationSettings
    #endif

    // calculate the current frame for the VAT
    float VATStartFrame = BVASNAME.x;
    float VATEndFrame = BVASNAME.y;
    float VATOffsetFrame = BVASNAME.z;
    float VATSpeed = BVASNAME.w;

    float totalFrames = VATEndFrame - VATStartFrame + 1.0;
    float time = bakedVertexAnimationTime * VATSpeed / totalFrames;
    // when you loop an animation after the first run (and for all subsequent loops), we wrap to frame #1, not to frame #0
    float frameCorrection = time < 1.0 ? 0.0 : 1.0;
    float numOfFrames = totalFrames - frameCorrection;
    float VATFrameNum = fract(time) * numOfFrames;
    VATFrameNum = mod(VATFrameNum + VATOffsetFrame, numOfFrames);
    VATFrameNum = floor(VATFrameNum);
    VATFrameNum += VATStartFrame + frameCorrection;

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