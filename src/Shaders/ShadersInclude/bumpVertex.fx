#if defined(BUMP) || defined(PARALLAX)
	#if defined(TANGENT) && defined(NORMAL)
		vec3 normalW = normalize(vec3(finalWorld * vec4(normalUpdated, 0.0)));
		vec3 tangentW = normalize(vec3(finalWorld * vec4(tangentUpdated.xyz, 0.0)));
		vec3 bitangentW = cross(normalW, tangentW) * tangentUpdated.w;
		vTBN = mat3(tangentW, bitangentW, normalW);
	#endif
#endif