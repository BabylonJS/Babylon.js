#if defined(BUMP) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(DETAIL)
	#if defined(TANGENT) && defined(NORMAL) 
		varying vTBN0: vec3f;
		varying vTBN1: vec3f;
		varying vTBN2: vec3f;
	#endif

	#ifdef OBJECTSPACE_NORMALMAP
		uniform normalMatrix: mat4x4f;

		fn toNormalMatrix(wMatrix: mat4x4f) -> mat4x4f
		{
			var ret: mat4x4f = inverse(wMatrix);
			ret = transpose(ret);
			ret[0][3] = 0.;
			ret[1][3] = 0.;
			ret[2][3] = 0.;
			ret[3] =  vec4f(0., 0., 0., 1.);
			return ret;
		}
	#endif

	fn perturbNormalBase(cotangentFrame: mat3x3f, normal: vec3f, scale: f32) -> vec3f
	{
		var output = normal;
		#ifdef NORMALXYSCALE
			output = normalize(output *  vec3f(scale, scale, 1.0));
		#endif

		return normalize(cotangentFrame * output);
	}

	fn perturbNormal(cotangentFrame: mat3x3f, textureSample: vec3f, scale: f32) -> vec3f
	{
		return perturbNormalBase(cotangentFrame, textureSample * 2.0 - 1.0, scale);
	}

	// Thanks to http://www.thetenthplanet.de/archives/1180
	fn cotangent_frame(normal: vec3f, p: vec3f, uv: vec2f, tangentSpaceParams: vec2f) -> mat3x3f
	{
		// get edge vectors of the pixel triangle
		var dp1: vec3f = dpdx(p);
		var dp2: vec3f = dpdy(p);
		var duv1: vec2f = dpdx(uv);
		var duv2: vec2f = dpdy(uv);

		// solve the linear system
		var dp2perp: vec3f = cross(dp2, normal);
		var dp1perp: vec3f = cross(normal, dp1);
		var tangent: vec3f = dp2perp * duv1.x + dp1perp * duv2.x;
		var bitangent: vec3f = dp2perp * duv1.y + dp1perp * duv2.y;

		// invert the tangent/bitangent if requested
		tangent *= tangentSpaceParams.x;
		bitangent *= tangentSpaceParams.y;

		// construct a scale-invariant frame
		var det: f32 = max(dot(tangent, tangent), dot(bitangent, bitangent));
		var invmax: f32 = select(inverseSqrt(det), 0.0, det == 0.0);
		return  mat3x3f(tangent * invmax, bitangent * invmax, normal);
	}
#endif
