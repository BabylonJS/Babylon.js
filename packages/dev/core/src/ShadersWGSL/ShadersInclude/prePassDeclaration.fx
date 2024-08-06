#ifdef PREPASS
#ifdef PREPASS_DEPTH
    varying vViewPos: vec3f;
#endif
#ifdef PREPASS_VELOCITY
    varying vCurrentPosition: vec4f;
    varying vPreviousPosition: vec4f;
#endif
#endif
