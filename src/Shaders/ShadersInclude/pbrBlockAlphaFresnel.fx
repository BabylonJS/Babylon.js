#ifdef ALPHAFRESNEL
#if defined(ALPHATEST) || defined(ALPHABLEND)
    struct alphaFresnelOutParams
    {
        float alpha;
    };

    void alphaFresnelBlock(
        const in vec3 normalW,
        const in vec3 viewDirectionW,
        const in float alpha,
        const in float microSurface,
        out alphaFresnelOutParams outParams
    )
    {
        // Convert approximate perceptual opacity (gamma-encoded opacity) to linear opacity (absorptance, or inverse transmission)
        // for use with the linear HDR render target. The final composition will be converted back to gamma encoded values for eventual display.
        // Uses power 2.0 rather than 2.2 for simplicity/efficiency, and because the mapping does not need to map the gamma applied to RGB.
        float opacityPerceptual = alpha;

        #ifdef LINEARALPHAFRESNEL
            float opacity0 = opacityPerceptual;
        #else
            float opacity0 = opacityPerceptual * opacityPerceptual;
        #endif
        float opacity90 = fresnelGrazingReflectance(opacity0);

        vec3 normalForward = faceforward(normalW, -viewDirectionW, normalW);

        // Calculate the appropriate linear opacity for the current viewing angle (formally, this quantity is the "directional absorptance").
        outParams.alpha = getReflectanceFromAnalyticalBRDFLookup_Jones(saturate(dot(viewDirectionW, normalForward)), vec3(opacity0), vec3(opacity90), sqrt(microSurface)).x;

        #ifdef ALPHATEST
            if (outParams.alpha < ALPHATESTVALUE)
                discard;

            #ifndef ALPHABLEND
                // Prevent to blend with the canvas.
                outParams.alpha = 1.0;
            #endif
        #endif
    }
#endif
#endif
