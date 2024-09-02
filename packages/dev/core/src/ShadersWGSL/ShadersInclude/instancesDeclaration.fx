#ifdef INSTANCES
	attribute world0 : vec4<f32>;
	attribute world1 : vec4<f32>;
	attribute world2 : vec4<f32>;
	attribute world3 : vec4<f32>;
    #ifdef INSTANCESCOLOR
        attribute instanceColor : vec4<f32>;
    #endif
    #if defined(THIN_INSTANCES) && !defined(WORLD_UBO)
        uniform world : mat4x4<f32>;
    #endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY) ||                  \
            defined(PREPASS_VELOCITY_LINEAR)
        attribute previousWorld0 : vec4<f32>;
        attribute previousWorld1 : vec4<f32>;
        attribute previousWorld2 : vec4<f32>;
        attribute previousWorld3 : vec4<f32>;
#ifdef THIN_INSTANCES
            uniform previousWorld : mat4x4<f32>;
#endif
#endif
#else
    #if !defined(WORLD_UBO)
	    uniform world : mat4x4<f32>;
    #endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY) ||              \
                defined(PREPASS_VELOCITY_LINEAR)
            uniform previousWorld : mat4x4<f32>;
#endif
#endif