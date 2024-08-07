#ifdef INSTANCES
	var finalWorld = mat4x4<f32>(vertexInputs.world0, vertexInputs.world1, vertexInputs.world2, vertexInputs.world3);
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) ||                  \
            defined(PREPASS_VELOCITY_LINEAR)
        var finalPreviousWorld = mat4x4<f32>(
            vertexInputs.previousWorld0, vertexInputs.previousWorld1,
            vertexInputs.previousWorld2, vertexInputs.previousWorld3);
#endif
#ifdef THIN_INSTANCES
#if !defined(WORLD_UBO)
        finalWorld = uniforms.world * finalWorld;
#else
        finalWorld = mesh.world * finalWorld;
#endif
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) ||                  \
            defined(PREPASS_VELOCITY_LINEAR)
        finalPreviousWorld = uniforms.previousWorld * finalPreviousWorld;
#endif
#endif
#else
#if !defined(WORLD_UBO)
	    var finalWorld = uniforms.world;
#else
	    var finalWorld = mesh.world;
#endif
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) ||  \
                            defined(PREPASS_VELOCITY_LINEAR)
            var finalPreviousWorld = uniforms.previousWorld;
#endif
#endif