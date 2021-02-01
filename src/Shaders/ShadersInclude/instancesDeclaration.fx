#ifdef INSTANCES
	attribute vec4 world0;
	attribute vec4 world1;
	attribute vec4 world2;
	attribute vec4 world3;
    #ifdef THIN_INSTANCES
        uniform mat4 world;
    #endif
#else
	uniform mat4 world;
#endif