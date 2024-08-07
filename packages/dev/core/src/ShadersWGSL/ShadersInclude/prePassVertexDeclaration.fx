#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
varying vPosition : vec3f;
#endif
#ifdef PREPASS_DEPTH
    varying vViewPos: vec3f;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    uniform previousViewProjection: mat4x4f;
    varying vCurrentPosition: vec4f;
    varying vPreviousPosition: vec4f;
#endif
#endif