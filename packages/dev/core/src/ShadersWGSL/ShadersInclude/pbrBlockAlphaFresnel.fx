#ifdef ALPHAFRESNEL
#if defined(ALPHATEST) || defined(ALPHABLEND)
    struct alphaFresnelOutParams
    {
        alpha: f32
    };

    #define pbr_inline
    fn alphaFresnelBlock(
        in var normalW: vec3f,
        in var viewDirectionW: vec3f,
        in var alpha: f32,
        in var microSurface: f32
    ) -> alphaFresnelOutParams
    {
        var outParams: alphaFresnelOutParams;
        // Convert approximate perceptual opacity (gamma-encoded opacity) to linear opacity (absorptance, or inverse transmission)
        // for use with the linear HDR render target. The final composition will be converted back to gamma encoded values for eventual display.
        // Uses power 2.0 rather than 2.2 for simplicity/efficiency, and because the mapping does not need to map the gamma applied to RGB.
        var opacityPerceptual: f32 = alpha;

        #ifdef LINEARALPHAFRESNEL
            var opacity0: f32 = opacityPerceptual;
        #else
            var opacity0: f32 = opacityPerceptual * opacityPerceptual;
        #endif
        var opacity90: f32 = fresnelGrazingReflectance(opacity0);

        var normalForward: vec3f = faceforward(normalW, -viewDirectionW, normalW);

        // Calculate the appropriate linear opacity for the current viewing angle (formally, this quantity is the "directional absorptance").
        outParams.alpha = getReflectanceFromAnalyticalBRDFLookup_Jones(saturate(dot(viewDirectionW, normalForward)),  vec3f(opacity0),  vec3f(opacity90), sqrt(microSurface)).x;

        #ifdef ALPHATEST
            if (outParams.alpha < ALPHATESTVALUE)
                discard;

            #ifndef ALPHABLEND
                // Prevent to blend with the canvas.
                outParams.alpha = 1.0;
            #endif
        #endif

        return outParams;
    }
#endif
#endif
