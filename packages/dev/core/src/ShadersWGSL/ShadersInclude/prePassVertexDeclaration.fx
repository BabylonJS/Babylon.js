#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
varying vPosition : vec3f;
#endif
#ifdef PREPASS_DEPTH
    varying vViewPos: vec3f;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    varying vNormViewDepth: f32;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
    uniform previousViewProjection: mat4x4f;
    varying vCurrentPosition: vec4f;
    varying vPreviousPosition: vec4f;
#endif
#endif