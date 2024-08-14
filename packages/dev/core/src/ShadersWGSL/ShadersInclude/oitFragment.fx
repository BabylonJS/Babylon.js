#ifdef ORDER_INDEPENDENT_TRANSPARENCY
    // -------------------------
    // dual depth peeling
    // -------------------------

    var fragDepth: f32 = fragmentInputs.position.z;   // 0 - 1

#ifdef ORDER_INDEPENDENT_TRANSPARENCY_16BITS
    var halfFloat: i32 = packHalf2x16( vec2f(fragDepth));
    var full: vec2f = unpackHalf2x16(halfFloat);
    fragDepth = full.x;
#endif

    var fragCoord: vec2i = vec2i(fragmentInputs.position.xy);
    var lastDepth: vec2f = textureLoad(oitDepthSampler, fragCoord, 0).rg;
    var lastFrontColor: vec4f = textureLoad(oitFrontColorSampler, fragCoord, 0);

    // depth value always increases
    // so we can use MAX blend equation
    fragmentOutputs.depth = vec2f(-MAX_DEPTH);
    // front color always increases
    // so we can use MAX blend equation
    fragmentOutputs.frontColor = lastFrontColor;

    // back color is separately blend afterwards each pass
    fragmentOutputs.backColor =  vec4f(0.0);

#ifdef USE_REVERSE_DEPTHBUFFER
    var furthestDepth: f32 = -lastDepth.x;
    var nearestDepth: f32 = lastDepth.y;
#else
    var nearestDepth: f32 = -lastDepth.x;
    var furthestDepth: f32 = lastDepth.y;
#endif
    // alpha is cleared to 0, and we want to initialize alpha to 1. 
    // The operation will be canceled in the fragment shader by writing 1 - a for the next passes
    var alphaMultiplier: f32 = 1.0 - lastFrontColor.a;
    
#ifdef USE_REVERSE_DEPTHBUFFER
    if (fragDepth > nearestDepth || fragDepth < furthestDepth) {
#else
    if (fragDepth < nearestDepth || fragDepth > furthestDepth) {
#endif
        // Skip this depth since it's been peeled.
        return fragmentOutputs;
    }

#ifdef USE_REVERSE_DEPTHBUFFER
    if (fragDepth < nearestDepth && fragDepth > furthestDepth) {
#else
    if (fragDepth > nearestDepth && fragDepth < furthestDepth) {
#endif
        // This needs to be peeled.
        // The ones remaining after MAX blended for
        // all need-to-peel will be peeled next pass.
        fragmentOutputs.depth = vec2f(-fragDepth, fragDepth);
        return fragmentOutputs;
    }


    // -------------------------------------------------------------------
    // If it reaches here, it is the layer we need to render for this pass
    // -------------------------------------------------------------------
#endif