#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
    // calculate the current frame for the VAT
    float VATStartFrame = bakedVertexAnimationSettings.x;
    float VATEndFrame = bakedVertexAnimationSettings.y;
    float VATOffsetFrame = bakedVertexAnimationSettings.z;
    float VATSpeed = bakedVertexAnimationSettings.w;
    // get number of frames
    float _numOfFrames = VATEndFrame - VATStartFrame + 1.0;
    // convert frame offset to secs elapsed
    float offsetCycle = VATOffsetFrame / VATSpeed;
    // add offset to time to get actual time, then
    // compute time elapsed in terms of frame cycle (30 fps/180 frames = 1/6 of an animation cycle per second)
    // so 0.5s = 0.08333 of an animation cycle, 7.5s = 1.25 of an animation cycle etc
    float VATFrameNum = fract((time + offsetCycle) * VATSpeed / _numOfFrames);
    // convert to actual frame
    VATFrameNum *= _numOfFrames;
    // round it to integer
    VATFrameNum = ceil(VATFrameNum);
    // add to start frame
    VATFrameNum += VATStartFrame;
    }

    mat4 VATInfluence;
    VATInfluence = readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[0], frameNum, boneTextureWidth) * matricesWeights[0];
    VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[1], frameNum, boneTextureWidth) * matricesWeights[1];
    VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[2], frameNum, boneTextureWidth) * matricesWeights[2];
    VATInfluence += readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture, matricesIndices[3], frameNum, boneTextureWidth) * matricesWeights[3];

    finalWorld = finalWorld * VATInfluence;
    worldPos = finalWorld * vec4(positionUpdated, 1.0);
}
#endif