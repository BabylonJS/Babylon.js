#ifdef DOF
    factor = sampleCoC(sampleCoord{X});    
    computedWeight = KERNEL_WEIGHT{X} * factor;
    sumOfWeights += computedWeight;
#else
    computedWeight = KERNEL_WEIGHT{X};
#endif

#ifdef PACKEDFLOAT
    blend += unpack(texture2D(textureSampler, sampleCoord{X})) * computedWeight;
#else
    blend += texture2D(textureSampler, sampleCoord{X}) * computedWeight;
#endif