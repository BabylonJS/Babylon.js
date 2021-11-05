#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
    // calculate the current frame for the VAT
    #ifdef INSTANCES
        let VATStartFrame: f32 = bakedVertexAnimationSettingsInstanced.x;
        let VATEndFrame: f32 = bakedVertexAnimationSettingsInstanced.y;
        let VATOffsetFrame: f32 = bakedVertexAnimationSettingsInstanced.z;
        let VATSpeed: f32 = bakedVertexAnimationSettingsInstanced.w;
    #else
        let VATStartFrame: f32 = uniforms.bakedVertexAnimationSettings.x;
        let VATEndFrame: f32 = uniforms.bakedVertexAnimationSettings.y;
        let VATOffsetFrame: f32 = uniforms.bakedVertexAnimationSettings.z;
        let VATSpeed: f32 = uniforms.bakedVertexAnimationSettings.w;
    #endif

    let totalFrames: f32 = VATEndFrame - VATStartFrame + 1.0;
    let time: f32 = uniforms.bakedVertexAnimationTime * VATSpeed / totalFrames;
    // when you loop an animation after the first run (and for all subsequent loops), we wrap to frame #1, not to frame #0
    let frameCorrection: f32 = select(1.0, 0.0, time < 1.0);
    let numOfFrames: f32 = totalFrames - frameCorrection;
    var VATFrameNum: f32 = fract(time) * numOfFrames;
    VATFrameNum = (VATFrameNum + VATOffsetFrame) % numOfFrames;
    VATFrameNum = floor(VATFrameNum);
    VATFrameNum = VATFrameNum + VATStartFrame + frameCorrection;

    var VATInfluence : mat4x4<f32>;
    VATInfluence = readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[0], VATFrameNum) * matricesWeights[0];
    #if NUM_BONE_INFLUENCERS > 1
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[1], VATFrameNum) * matricesWeights[1];
    #endif
    #if NUM_BONE_INFLUENCERS > 2
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[2], VATFrameNum) * matricesWeights[2];
    #endif
    #if NUM_BONE_INFLUENCERS > 3
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[3], VATFrameNum) * matricesWeights[3];
    #endif
    #if NUM_BONE_INFLUENCERS > 4
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[0], VATFrameNum) * matricesWeightsExtra[0];
    #endif
    #if NUM_BONE_INFLUENCERS > 5
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[1], VATFrameNum) * matricesWeightsExtra[1];
    #endif
    #if NUM_BONE_INFLUENCERS > 6
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[2], VATFrameNum) * matricesWeightsExtra[2];
    #endif
    #if NUM_BONE_INFLUENCERS > 7
        VATInfluence = VATInfluence + readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndicesExtra[3], VATFrameNum) * matricesWeightsExtra[3];
    #endif

    finalWorld = finalWorld * VATInfluence;
}
#endif