#ifdef ORDER_INDEPENDANT_TRANSPARENCY
    // -------------------------
    // dual depth peeling
    // -------------------------

    float fragDepth = gl_FragCoord.z;   // 0 - 1

    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    vec2 lastDepth = texelFetch(uDepth, fragCoord, 0).rg;
    vec4 lastFrontColor = texelFetch(uFrontColor, fragCoord, 0);

    // depth value always increases
    // so we can use MAX blend equation
    depth.rg = vec2(-MAX_DEPTH);

    // front color always increases
    // so we can use MAX blend equation
    frontColor = lastFrontColor;

    // back color is separately blend afterwards each pass
    backColor = vec4(0.0);

    float nearestDepth = - lastDepth.x;
    float furthestDepth = lastDepth.y;
    float alphaMultiplier = 1.0 - lastFrontColor.a;


    if (fragDepth < nearestDepth || fragDepth > furthestDepth) {
        // Skip this depth since it's been peeled.
        return;
    }

    if (fragDepth > nearestDepth && fragDepth < furthestDepth) {
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