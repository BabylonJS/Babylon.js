#ifdef PREPASS
#ifdef PREPASS_DEPTH
    varying vec3 vViewPos;
#endif
#ifdef PREPASS_VELOCITY
    uniform mat4 previousViewProjection;
    varying vec4 vCurrentPosition;
    varying vec4 vPreviousPosition;
#endif
#endif