#ifdef DOF
    factor = sampleCoC(fragmentInputs.sampleCenter + uniforms.delta * KERNEL_DEP_OFFSET{X});
    computedWeight = KERNEL_DEP_WEIGHT{X} * factor;
    sumOfWeights += computedWeight;
#else
    computedWeight = KERNEL_DEP_WEIGHT{X};
#endif

#ifdef PACKEDFLOAT
    blend += unpack(textureSample(textureSampler, textureSamplerSampler, fragmentInputs.sampleCenter + uniforms.delta * KERNEL_DEP_OFFSET{X})) * computedWeight;
#else
    blend += textureSample(textureSampler, textureSamplerSampler, fragmentInputs.sampleCenter + uniforms.delta * KERNEL_DEP_OFFSET{X}) * computedWeight;
#endif