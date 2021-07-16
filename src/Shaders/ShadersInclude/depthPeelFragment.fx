#if defined(DEPTH_PEELING) || defined(SS_DEPTHINREFRACTIONALPHA)
    float sceneDepthWorld = gl_FragCoord.z * 2. - 1.; // Depth range being 0 to 1 -> transform to -1 - 1
    sceneDepthWorld = sceneDepthWorld / gl_FragCoord.w; // Revert to the projection space z
    float sceneDepthNormalized = (sceneDepthWorld + depthPeelValues.x) / depthPeelValues.y; // Apply camera setup to transform back to 0 - 1 but in a linear way
#endif

#ifdef DEPTH_PEELING
    sceneDepthNormalized -= Epsilon;
    #ifdef DEPTH_PEELING_FRONT
        // Handle depth-peeling against current depth textures.
        vec2 screenCoords = vec2(gl_FragCoord.x / depthPeelValues.z, gl_FragCoord.y / depthPeelValues.w);
        #ifdef DEPTH_PEELING_FRONT_INVERSE
            float frontDepth = 1.0 - texture2D(frontDepthTexture, screenCoords).a + Epsilon;
        #else
            float frontDepth = texture2D(frontDepthTexture, screenCoords).r;
        #endif
        if (frontDepth >= sceneDepthNormalized) {
            discard;
        }
        #ifdef DEPTH_PEELING_BACK
            float backDepth = texture2D(backDepthTexture, screenCoords).r;
            if (backDepth <= sceneDepthNormalized) {
                discard;
            }
        #endif
    #endif
#endif