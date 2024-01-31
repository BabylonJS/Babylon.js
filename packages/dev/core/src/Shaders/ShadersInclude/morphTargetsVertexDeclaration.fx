#ifdef MORPHTARGETS
	#ifndef MORPHTARGETS_TEXTURE
		attribute vec3 position{X};

		#ifdef MORPHTARGETS_NORMAL
		attribute vec3 normal{X};
		#endif

		#ifdef MORPHTARGETS_TANGENT
		attribute vec3 tangent{X};
		#endif

		#ifdef MORPHTARGETS_UV
		attribute vec2 uv_{X};
		#endif
	#elif {X} == 0
		uniform int morphTargetCount;
	#endif
#endif