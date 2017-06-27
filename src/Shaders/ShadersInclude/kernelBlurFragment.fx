#ifdef PACKEDFLOAT
    blend += unpack(texture2D(textureSampler, sampleCoord{X})) * KERNEL_WEIGHT{X};
#else
    blend += texture2D(textureSampler, sampleCoord{X}) * KERNEL_WEIGHT{X};
#endif