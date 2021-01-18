#ifdef PREPASS_DEPTH
    vViewPos = (view * worldPos).rgb;
#endif

#if defined(PREPASS_VELOCITY) && defined(BONES_VELOCITY_ENABLED)
    vCurrentPosition = viewProjection * worldPos;

#if NUM_BONE_INFLUENCERS > 0
    mat4 previousInfluence;
    previousInfluence = mPreviousBones[int(matricesIndices[0])] * matricesWeights[0];
    #if NUM_BONE_INFLUENCERS > 1
        previousInfluence += mPreviousBones[int(matricesIndices[1])] * matricesWeights[1];
    #endif  
    #if NUM_BONE_INFLUENCERS > 2
        previousInfluence += mPreviousBones[int(matricesIndices[2])] * matricesWeights[2];
    #endif  
    #if NUM_BONE_INFLUENCERS > 3
        previousInfluence += mPreviousBones[int(matricesIndices[3])] * matricesWeights[3];
    #endif
    #if NUM_BONE_INFLUENCERS > 4
        previousInfluence += mPreviousBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
    #endif  
    #if NUM_BONE_INFLUENCERS > 5
        previousInfluence += mPreviousBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
    #endif  
    #if NUM_BONE_INFLUENCERS > 6
        previousInfluence += mPreviousBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
    #endif  
    #if NUM_BONE_INFLUENCERS > 7
        previousInfluence += mPreviousBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
    #endif

    vPreviousPosition = previousViewProjection * previousWorld * previousInfluence * vec4(positionUpdated, 1.0);
#else
    vPreviousPosition = previousViewProjection * previousWorld * vec4(positionUpdated, 1.0);
#endif
#endif