#ifdef DOF
    factor = sampleCoC(sampleCenter + delta * KERNEL_DEP_OFFSET{X});
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