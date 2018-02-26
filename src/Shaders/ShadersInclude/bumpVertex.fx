#if defined(BUMP) || defined(PARALLAX)
	#if defined(TANGENT) && defined(NORMAL)
		vec3 tbnNormal = normalize(normalUpdated);
		vec3 tbnTangent = normalize(tangentUpdated.xyz);
		vec3 tbnBitangent = cross(tbnNormal, tbnTangent) * tangentUpdated.w;
		vTBN = mat3(finalWorld) * mat3(tbnTangent, tbnBitangent, tbnNormal);
	#endif
#endif