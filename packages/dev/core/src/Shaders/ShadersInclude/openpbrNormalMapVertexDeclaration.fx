#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL) 
		varying mat3 vTBN;
	#endif
#endif
