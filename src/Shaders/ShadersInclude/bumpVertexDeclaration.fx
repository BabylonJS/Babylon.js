#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP)
	#if defined(TANGENT) && defined(NORMAL) 
		varying mat3 vTBN;
	#endif
#endif
