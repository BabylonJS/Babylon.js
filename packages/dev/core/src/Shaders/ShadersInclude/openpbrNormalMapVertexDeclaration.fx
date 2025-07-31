#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(GEOMETRY_COAT_NORMAL) || defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL) 
		varying mat3 vTBN;
	#endif
#endif
