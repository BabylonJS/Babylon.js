#ifdef PREPASS
#ifdef PREPASS_DEPTH
    varying vec3 vViewPos;
#endif
#ifdef PREPASS_VELOCITY
    uniform mat4 previousViewProjection;
    varying vec4 vCurrentPosition;
    varying vec4 vPreviousPosition;
    #ifdef INSTANCES
        attribute vec4 previousWorld0;
        attribute vec4 previousWorld1;
        attribute vec4 previousWorld2;
        attribute vec4 previousWorld3;
        #ifdef THIN_INSTANCES
            uniform mat4 previousWorld;
        #endif
    #else
        uniform mat4 previousWorld;
    #endif
#endif
#endif