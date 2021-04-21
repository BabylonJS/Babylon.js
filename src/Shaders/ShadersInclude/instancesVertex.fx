#ifdef INSTANCES
	mat4 finalWorld = mat4(world0, world1, world2, world3);
	#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
		mat4 finalPreviousWorld = mat4(previousWorld0, previousWorld1, previousWorld2, previousWorld3);
	#endif
    #ifdef THIN_INSTANCES
	    finalWorld = world * finalWorld;
		#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
			finalPreviousWorld = previousWorld * finalPreviousWorld;
		#endif
    #endif
#else
	mat4 finalWorld = world;
	#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
        mat4 finalPreviousWorld = previousWorld;
    #endif
#endif