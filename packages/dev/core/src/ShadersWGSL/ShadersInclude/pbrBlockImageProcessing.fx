#if defined(IMAGEPROCESSINGPOSTPROCESS) || defined(SS_SCATTERING)
    // Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
    // this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
    //
    // Subsurface scattering also requires to stay in linear space
#if !defined(SKIPFINALCOLORCLAMP)
    finalColor = vec4f(clamp(finalColor.rgb, vec3f(0.), vec3f(30.0)), finalColor.a);
#endif
#else
    // Alway run to ensure we are going back to gamma space.
    finalColor = applyImageProcessing(finalColor);
#endif

    finalColor = vec4f(finalColor.rgb, finalColor.a * mesh.visibility);

#ifdef PREMULTIPLYALPHA
    // Convert to associative (premultiplied) format if needed.
    finalColor = vec4f(finalColor.rgb * finalColor.a, finalColor.a);
    ;
#endif
