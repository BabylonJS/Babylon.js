#if defined(GEOMETRY_NORMAL) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(DETAIL)
	#if defined(TANGENT) && defined(NORMAL) 
		varying mat3 vTBN;
	#endif

	#ifdef OBJECTSPACE_NORMALMAP
		uniform mat4 normalMatrix;

		#if defined(WEBGL2) || defined(WEBGPU)
			mat4 toNormalMatrix(mat4 wMatrix)
			{
				mat4 ret = inverse(wMatrix);
				ret = transpose(ret);
				ret[0][3] = 0.;
				ret[1][3] = 0.;
				ret[2][3] = 0.;
				ret[3] = vec4(0., 0., 0., 1.);
				return ret;
			}
		#else
			mat4 toNormalMatrix(mat4 m)
			{
				float
					a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
					a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
					a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
					a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

					b00 = a00 * a11 - a01 * a10,
					b01 = a00 * a12 - a02 * a10,
					b02 = a00 * a13 - a03 * a10,
					b03 = a01 * a12 - a02 * a11,
					b04 = a01 * a13 - a03 * a11,
					b05 = a02 * a13 - a03 * a12,
					b06 = a20 * a31 - a21 * a30,
					b07 = a20 * a32 - a22 * a30,
					b08 = a20 * a33 - a23 * a30,
					b09 = a21 * a32 - a22 * a31,
					b10 = a21 * a33 - a23 * a31,
					b11 = a22 * a33 - a23 * a32,

					det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

				mat4 mi = mat4(
					a11 * b11 - a12 * b10 + a13 * b09,
					a02 * b10 - a01 * b11 - a03 * b09,
					a31 * b05 - a32 * b04 + a33 * b03,
					a22 * b04 - a21 * b05 - a23 * b03,
					a12 * b08 - a10 * b11 - a13 * b07,
					a00 * b11 - a02 * b08 + a03 * b07,
					a32 * b02 - a30 * b05 - a33 * b01,
					a20 * b05 - a22 * b02 + a23 * b01,
					a10 * b10 - a11 * b08 + a13 * b06,
					a01 * b08 - a00 * b10 - a03 * b06,
					a30 * b04 - a31 * b02 + a33 * b00,
					a21 * b02 - a20 * b04 - a23 * b00,
					a11 * b07 - a10 * b09 - a12 * b06,
					a00 * b09 - a01 * b07 + a02 * b06,
					a31 * b01 - a30 * b03 - a32 * b00,
					a20 * b03 - a21 * b01 + a22 * b00) / det;

				return mat4(mi[0][0], mi[1][0], mi[2][0], mi[3][0],
					mi[0][1], mi[1][1], mi[2][1], mi[3][1],
					mi[0][2], mi[1][2], mi[2][2], mi[3][2],
					mi[0][3], mi[1][3], mi[2][3], mi[3][3]);
			}
		#endif
	#endif

	vec3 perturbNormalBase(mat3 cotangentFrame, vec3 normal, float scale)
	{
		#ifdef NORMALXYSCALE
			normal = normalize(normal * vec3(scale, scale, 1.0));
		#endif

		return normalize(cotangentFrame * normal);
	}

	vec3 perturbNormal(mat3 cotangentFrame, vec3 textureSample, float scale)
	{
		return perturbNormalBase(cotangentFrame, textureSample * 2.0 - 1.0, scale);
	}

	// Thanks to http://www.thetenthplanet.de/archives/1180
	mat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv, vec2 tangentSpaceParams)
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
		vec3 bitangent = dp2perp * duv1.y + dp1perp * duv2.y;

		// invert the tangent/bitangent if requested
		tangent *= tangentSpaceParams.x;
		bitangent *= tangentSpaceParams.y;

		// construct a scale-invariant frame
		float det = max(dot(tangent, tangent), dot(bitangent, bitangent));
		float invmax = det == 0.0 ? 0.0 : inversesqrt(det);
		return mat3(tangent * invmax, bitangent * invmax, normal);
	}
#endif
