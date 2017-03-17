#if defined(BUMP) || defined(PARALLAX)
	#if defined(TANGENT) && defined(NORMAL)
		vec3 normalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
		vec3 tangentW = normalize(vec3(finalWorld * vec4(tangent.xyz, 0.0)));
		vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
		vTBN = mat3(tangentW, bitangentW, normalW);
	#endif
#endif