#ifdef DOF
    factor = sampleCoC(fragmentInputs.sampleCoord{X});    
    computedWeight = KERNEL_WEIGHT{X} * factor;
    sumOfWeights += computedWeight;
#else
    computedWeight = KERNEL_WEIGHT{X};
#endif

#ifdef PACKEDFLOAT
    blend += unpack(textureSample(textureSampler, textureSamplerSampler, fragmentInputs.sampleCoord{X})) * computedWeight;
#else
    blend += textureSample(textureSampler, textureSamplerSampler, fragmentInputs.sampleCoord{X}) * computedWeight;
#endif