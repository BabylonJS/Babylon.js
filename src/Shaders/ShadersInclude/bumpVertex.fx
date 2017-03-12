#if defined(BUMP) || defined(PARALLAX)
	#if defined(TANGENT) && defined(NORMAL) 
		vec3 bitangent = cross(normal, tangent.xyz) * sign(tangent.w); //aka binormal
		vTBN = mat3(tangent.xyz, bitangent, normal);
	#endif
#endif