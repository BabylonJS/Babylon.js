#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL)
		var tbnNormal: vec3f = normalize(normalUpdated);
		var tbnTangent: vec3f = normalize(tangentUpdated.xyz);
		var tbnBitangent: vec3f = cross(tbnNormal, tbnTangent) * tangentUpdated.w;
		var matTemp =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz) *  mat3x3f(tbnTangent, tbnBitangent, tbnNormal);
		vertexOutputs.vTBN0 = matTemp[0];
		vertexOutputs.vTBN1 = matTemp[1];
		vertexOutputs.vTBN2 = matTemp[2];
	#endif
#endif