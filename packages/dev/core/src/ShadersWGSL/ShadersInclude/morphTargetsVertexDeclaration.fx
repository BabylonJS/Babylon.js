#ifdef MORPHTARGETS
	#ifndef MORPHTARGETS_TEXTURE
		#ifdef MORPHTARGETS_POSITION
		attribute position{X} : vec3<f32>;
		#endif

		#ifdef MORPHTARGETS_NORMAL
		attribute normal{X} : vec3<f32>;
		#endif

		#ifdef MORPHTARGETS_TANGENT
		attribute tangent{X} : vec3<f32>;
		#endif

		#ifdef MORPHTARGETS_UV
		attribute uv_{X} : vec2<f32>;
		#endif

		#ifdef MORPHTARGETS_UV2
		attribute uv2_{X} : vec2<f32>;
		#endif

        #ifdef MORPHTARGETS_COLOR
        attribute color{X} : vec4<f32>;
        #endif
	#elif {X} == 0
		uniform morphTargetCount: f32;
	#endif
#endif
