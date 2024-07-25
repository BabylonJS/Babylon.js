#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL)
		var tbnNormal: vec3f = normalize(normalUpdated);
		var tbnTangent: vec3f = normalize(tangentUpdated.xyz);
		var tbnBitangent: vec3f = cross(tbnNormal, tbnTangent) * tangentUpdated.w;
		vTBN =  mat3x3f(finalWorld) *  mat3x3f(tbnTangent, tbnBitangent, tbnNormal);
	#endif
#endif