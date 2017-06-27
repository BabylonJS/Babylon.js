#ifdef PACKEDFLOAT
    blend += unpack(texture2D(textureSampler, sampleCenter + delta * KERNEL_DEP_OFFSET{X})) * KERNEL_DEP_WEIGHT{X};
#else
    blend += texture2D(textureSampler, sampleCenter + delta * KERNEL_DEP_OFFSET{X}) * KERNEL_DEP_WEIGHT{X};
#endif