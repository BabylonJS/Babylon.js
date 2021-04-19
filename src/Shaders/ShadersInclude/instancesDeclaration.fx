#ifdef INSTANCES
	attribute vec4 world0;
	attribute vec4 world1;
	attribute vec4 world2;
	attribute vec4 world3;
    #if defined(THIN_INSTANCES) && !defined(WORLD_UBO)
        uniform mat4 world;
    #endif
	#if defined(VELOCITY) || defined(PREPASS_VELOCITY)
		attribute vec4 previousWorld0;
		attribute vec4 previousWorld1;
		attribute vec4 previousWorld2;
		attribute vec4 previousWorld3;
        #ifdef THIN_INSTANCES
            uniform mat4 previousWorld;
        #endif
	#endif
#else
    #if !defined(WORLD_UBO)
	    uniform mat4 world;
    #endif
    #if defined(VELOCITY) || defined(PREPASS_VELOCITY)
        uniform mat4 previousWorld;
    #endif
#endif