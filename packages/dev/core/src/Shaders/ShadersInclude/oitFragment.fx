#ifdef ORDER_INDEPENDENT_TRANSPARENCY
    // -------------------------
    // dual depth peeling
    // -------------------------

    float fragDepth = gl_FragCoord.z;   // 0 - 1

#ifdef ORDER_INDEPENDENT_TRANSPARENCY_16BITS
    uint halfFloat = packHalf2x16(vec2(fragDepth));
    vec2 full = unpackHalf2x16(halfFloat);
    fragDepth = full.x;
#endif

    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    vec2 lastDepth = texelFetch(oitDepthSampler, fragCoord, 0).rg;
    vec4 lastFrontColor = texelFetch(oitFrontColorSampler, fragCoord, 0);

    // depth value always increases
    // so we can use MAX blend equation
    depth.rg = vec2(-MAX_DEPTH);
    // front color always increases
    // so we can use MAX blend equation
    frontColor = lastFrontColor;

    // back color is separately blend afterwards each pass
    backColor = vec4(0.0);

#ifdef USE_REVERSE_DEPTHBUFFER
    float furthestDepth = -lastDepth.x;
    float nearestDepth = lastDepth.y;
#else
    float nearestDepth = -lastDepth.x;
    float furthestDepth = lastDepth.y;
#endif
    // alpha is cleared to 0, and we want to initialize alpha to 1. 
    // The operation will be canceled in the fragment shader by writing 1 - a for the next passes
    float alphaMultiplier = 1.0 - lastFrontColor.a;
    
#ifdef USE_REVERSE_DEPTHBUFFER
    if (fragDepth > nearestDepth || fragDepth < furthestDepth) {
#else
    if (fragDepth < nearestDepth || fragDepth > furthestDepth) {
#endif
        // Skip this depth since it's been peeled.
        return;
    }

#ifdef USE_REVERSE_DEPTHBUFFER
    if (fragDepth < nearestDepth && fragDepth > furthestDepth) {
#else
    if (fragDepth > nearestDepth && fragDepth < furthestDepth) {
#endif
        // This needs to be peeled.
        // The ones remaining after MAX blended for
        // all need-to-peel will be peeled next pass.
        depth.rg = vec2(-fragDepth, fragDepth);
        return;
    }


    // -------------------------------------------------------------------
    // If it reaches here, it is the layer we need to render for this pass
    // -------------------------------------------------------------------
#endif