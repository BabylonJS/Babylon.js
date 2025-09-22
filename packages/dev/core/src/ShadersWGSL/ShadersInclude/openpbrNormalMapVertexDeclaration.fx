#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL) 
		varying vTBN0: vec3f;
		varying vTBN1: vec3f;
		varying vTBN2: vec3f;
	#endif
#endif
