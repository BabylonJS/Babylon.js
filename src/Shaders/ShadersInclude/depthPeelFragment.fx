#if defined(DEPTH_PEELING)
    float sceneDepthWorld = gl_FragCoord.z * 2. - 1.; // Depth range being 0 to 1 -> transform to -1 - 1
    sceneDepthWorld = sceneDepthWorld / gl_FragCoord.w; // Revert to the projection space z
    float sceneDepthNormalized = (sceneDepthWorld + depthPeelValues.x) / depthPeelValues.y; // Apply camera setup to transform back to 0 - 1 but in a linear way
#endif

#ifdef DEPTH_PEELING
    vec2 screenCoords = vec2(gl_FragCoord.x / depthPeelValues.z, gl_FragCoord.y / depthPeelValues.w);
    #ifdef DEPTH_PEELING_FRONT
        // Handle depth-peeling against current depth textures.
        float frontDepth = texture2D(frontDepthTexture, screenCoords).r;
        #ifdef DEPTH_PEELING_FRONT_RESOLVE
            // If this is the depth layer that we're interested in, render it. Otherwise, discard.
            if (abs(frontDepth - sceneDepthNormalized) > 0.0000001) {
                discard;
            }
        #else // Generating the depth peel buffer
            sceneDepthNormalized -= 0.0000001;
            // If this fragment is in front of the front depth peel, discard it.
            if (frontDepth >= sceneDepthNormalized) {
                discard;
            }
        #endif
        
    #endif
    #ifdef DEPTH_PEELING_BACK
        // Ensure that the fragment is in front of the back-most layer (i.e. the opaque layer)
        float backDepth = texture2D(backDepthTexture, screenCoords).r;
        if (backDepth <= sceneDepthNormalized) {
            discard;
        }
    #endif
#endif