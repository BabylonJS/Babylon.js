#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL) 
		varying vTBN: mat3x3f;
	#endif
#endif
