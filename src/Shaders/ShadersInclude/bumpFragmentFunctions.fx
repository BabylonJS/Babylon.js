#ifdef BUMP
	varying vec2 vBumpUV;
	uniform vec2 vBumpInfos;
	uniform sampler2D bumpSampler;

	// Thanks to http://www.thetenthplanet.de/archives/1180
	mat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv)
	{
		// get edge vectors of the pixel triangle
		vec3 dp1 = dFdx(p);
		vec3 dp2 = dFdy(p);
		vec2 duv1 = dFdx(uv);
		vec2 duv2 = dFdy(uv);

		// solve the linear system
		vec3 dp2perp = cross(dp2, normal);
		vec3 dp1perp = cross(normal, dp1);
		vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;
		vec3 binormal = dp2perp * duv1.y + dp1perp * duv2.y;

		// construct a scale-invariant frame 
		float invmax = inversesqrt(max(dot(tangent, tangent), dot(binormal, binormal)));
		return mat3(tangent * invmax, binormal * invmax, normal);
	}

	vec3 perturbNormal(vec3 viewDir)
	{
		vec3 map = texture2D(bumpSampler, vBumpUV).xyz;
		map = map * 255. / 127. - 128. / 127.;
		mat3 TBN = cotangent_frame(vNormalW * vBumpInfos.y, -viewDir, vBumpUV);
		return normalize(TBN * map);
	}
#endif