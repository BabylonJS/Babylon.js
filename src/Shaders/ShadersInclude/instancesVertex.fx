#ifdef INSTANCES
	mat4 finalWorld = mat4(world0, world1, world2, world3);
    #ifdef THIN_INSTANCES
	    finalWorld = world * finalWorld;
    #endif
#else
	mat4 finalWorld = world;
#endif