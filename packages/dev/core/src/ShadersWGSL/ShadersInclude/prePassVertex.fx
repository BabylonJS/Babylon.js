#ifdef PREPASS_DEPTH
    vertexOutputs.vViewPos = (scene.view * worldPos).rgb;
#endif

#ifdef PREPASS_LOCAL_POSITION
    vertexOutputs.vPosition = positionUpdated.xyz;
#endif

#if defined(PREPASS_VELOCITY) && defined(BONES_VELOCITY_ENABLED) ||        \
        defined(PREPASS_VELOCITY_LINEAR)
    vertexOutputs.vCurrentPosition = scene.viewProjection * worldPos;

#if NUM_BONE_INFLUENCERS > 0
    var previousInfluence: mat4x4f;
    previousInfluence = mPreviousBones[ i32(matricesIndices[0])] * matricesWeights[0];
    #if NUM_BONE_INFLUENCERS > 1
        previousInfluence += mPreviousBones[ i32(matricesIndices[1])] * matricesWeights[1];
    #endif  
    #if NUM_BONE_INFLUENCERS > 2
        previousInfluence += mPreviousBones[ i32(matricesIndices[2])] * matricesWeights[2];
    #endif  
    #if NUM_BONE_INFLUENCERS > 3
        previousInfluence += mPreviousBones[ i32(matricesIndices[3])] * matricesWeights[3];
    #endif
    #if NUM_BONE_INFLUENCERS > 4
        previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
    #endif  
    #if NUM_BONE_INFLUENCERS > 5
        previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
    #endif  
    #if NUM_BONE_INFLUENCERS > 6
        previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
    #endif  
    #if NUM_BONE_INFLUENCERS > 7
        previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
    #endif

    vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld * previousInfluence *  vec4f(positionUpdated, 1.0);
#else
    vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld *  vec4f(positionUpdated, 1.0);
#endif
#endif
