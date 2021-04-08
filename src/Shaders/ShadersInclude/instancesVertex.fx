#ifdef INSTANCES
	mat4 finalWorld = mat4(world0, world1, world2, world3);
	#ifdef PREPASS_VELOCITY
		mat4 previousWorld = mat4(previousWorld0, previousWorld1, previousWorld2, previousWorld3);
	#endif
    #ifdef THIN_INSTANCES
	    finalWorld = world * finalWorld;
    #endif
#else
	mat4 finalWorld = world;
#endif