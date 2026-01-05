#ifdef PREPASS_DEPTH
    vertexOutputs.vViewPos = (scene.view * worldPos).rgb;
#endif

#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    vertexOutputs.vNormViewDepth = ((scene.view * worldPos).z - uniforms.cameraInfo.x) / (uniforms.cameraInfo.y - uniforms.cameraInfo.x);
#endif

#ifdef PREPASS_LOCAL_POSITION
    vertexOutputs.vPosition = positionUpdated.xyz;
#endif

#if (defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
    vertexOutputs.vCurrentPosition = scene.viewProjection * worldPos;

#if NUM_BONE_INFLUENCERS > 0
    var previousInfluence: mat4x4f;
    previousInfluence = uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[0])] * vertexInputs.matricesWeights[0];
    #if NUM_BONE_INFLUENCERS > 1
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[1])] * vertexInputs.matricesWeights[1];
    #endif  
    #if NUM_BONE_INFLUENCERS > 2
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[2])] * vertexInputs.matricesWeights[2];
    #endif  
    #if NUM_BONE_INFLUENCERS > 3
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[3])] * vertexInputs.matricesWeights[3];
    #endif
    #if NUM_BONE_INFLUENCERS > 4
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[0])] * vertexInputs.matricesWeightsExtra[0];
    #endif  
    #if NUM_BONE_INFLUENCERS > 5
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[1])] * vertexInputs.matricesWeightsExtra[1];
    #endif  
    #if NUM_BONE_INFLUENCERS > 6
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[2])] * vertexInputs.matricesWeightsExtra[2];
    #endif  
    #if NUM_BONE_INFLUENCERS > 7
        previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[3])] * vertexInputs.matricesWeightsExtra[3];
    #endif

    vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld * previousInfluence *  vec4f(positionUpdated, 1.0);
#else
    vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld *  vec4f(positionUpdated, 1.0);
#endif
#endif
