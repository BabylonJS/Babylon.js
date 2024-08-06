#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
varying vPosition : vec3f;
#endif
#ifdef PREPASS_DEPTH
    varying vViewPos: vec3f;
#endif
#ifdef PREPASS_VELOCITY
    uniform previousViewProjection: mat4x4f;
    varying vCurrentPosition: vec4f;
    varying vPreviousPosition: vec4f;
#endif
#endif