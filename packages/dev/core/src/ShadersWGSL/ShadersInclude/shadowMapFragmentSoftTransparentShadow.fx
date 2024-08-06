#if SM_SOFTTRANSPARENTSHADOW == 1
    if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0))))) / 64.0 >= softTransparentShadowSM.x * alpha) {
        discard;
    }
#endif
