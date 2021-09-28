#ifdef INSTANCES
	var finalWorld = mat4x4<f32>(world0, world1, world2, world3);
	#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
		var finalPreviousWorld = mat4x4<f32>(previousWorld0, previousWorld1, previousWorld2, previousWorld3);
	#endif
    #ifdef THIN_INSTANCES
        #if !defined(WORLD_UBO)
            finalWorld = uniforms.world * finalWorld;
        #else
            finalWorld = mesh.world * finalWorld;
        #endif
		#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
			finalPreviousWorld = previousWorld * finalPreviousWorld;
		#endif
    #endif
#else
    #if !defined(WORLD_UBO)
	    var finalWorld = uniforms.world;
    #else
	    var finalWorld = mesh.world;
    #endif
	#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
        var finalPreviousWorld = previousWorld;
    #endif
#endif