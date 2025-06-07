#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
    varying vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
    varying vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    varying float vNormViewDepth;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    uniform mat4 previousViewProjection;
    varying vec4 vCurrentPosition;
    varying vec4 vPreviousPosition;
#endif
#endif