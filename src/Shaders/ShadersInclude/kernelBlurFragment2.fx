#ifdef DOF
    sampleDepth = sampleDistance(sampleCoord{X});
    factor = clamp(1.0-((centerSampleDepth - sampleDepth)/centerSampleDepth),0.0,1.0);
    computedWeight = KERNEL_DEP_WEIGHT{X} * factor;
    sumOfWeights += computedWeight;
#else
    computedWeight = KERNEL_DEP_WEIGHT{X};
#endif

#ifdef PACKEDFLOAT
    blend += unpack(texture2D(textureSampler, sampleCenter + delta * KERNEL_DEP_OFFSET{X})) * computedWeight;
#else
    blend += texture2D(textureSampler, sampleCenter + delta * KERNEL_DEP_OFFSET{X}) * computedWeight;
#endif