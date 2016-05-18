#ifdef BUMP
	varying vec2 vBumpUV;
	uniform vec3 vBumpInfos;
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

	vec3 perturbNormal(vec3 viewDir, mat3 cotangentFrame, vec2 uv)
	{
		vec3 map = texture2D(bumpSampler, uv).xyz;

	#ifdef OPENGLNORMALMAP
		map.y = 1.0 - map.y;
	#endif

		map = map * 255. / 127. - 128. / 127.;
		return normalize(cotangentFrame * map);
	}

	#ifdef PARALLAX
		const float minSamples = 4.;
		const float maxSamples = 15.;
		const int iMaxSamples = 15;

		// http://www.gamedev.net/page/resources/_/technical/graphics-programming-and-theory/a-closer-look-at-parallax-occlusion-mapping-r3262
		vec2 parallaxOcclusion(vec3 vViewDirCoT, vec3 vNormalCoT, vec2 texCoord, float parallaxScale) {

			float parallaxLimit = length(vViewDirCoT.xy) / vViewDirCoT.z;
			parallaxLimit *= parallaxScale;
			vec2 vOffsetDir = normalize(vViewDirCoT.xy);
			vec2 vMaxOffset = vOffsetDir * parallaxLimit;
			float numSamples = maxSamples + (dot(vViewDirCoT, vNormalCoT) * (minSamples - maxSamples));
			float stepSize = 1.0 / numSamples;

			// Initialize the starting view ray height and the texture offsets.
			float currRayHeight = 1.0;
			vec2 vCurrOffset = vec2(0, 0);
			vec2 vLastOffset = vec2(0, 0);

			float lastSampledHeight = 1.0;
			float currSampledHeight = 1.0;

			for (int i = 0; i < iMaxSamples; i++)
			{
				currSampledHeight = texture2D(bumpSampler, vBumpUV + vCurrOffset).w;

				// Test if the view ray has intersected the surface.
				if (currSampledHeight > currRayHeight)
				{
					float delta1 = currSampledHeight - currRayHeight;
					float delta2 = (currRayHeight + stepSize) - lastSampledHeight;
					float ratio = delta1 / (delta1 + delta2);
					vCurrOffset = (ratio)* vLastOffset + (1.0 - ratio) * vCurrOffset;

					// Force the exit of the loop
					break;
				}
				else
				{
					currRayHeight -= stepSize;
					vLastOffset = vCurrOffset;
					vCurrOffset += stepSize * vMaxOffset;

					lastSampledHeight = currSampledHeight;
				}
			}

			return vCurrOffset;
		}

		vec2 parallaxOffset(vec3 viewDir, float heightScale)
		{
			// calculate amount of offset for Parallax Mapping With Offset Limiting
			float height = texture2D(bumpSampler, vBumpUV).w;
			vec2 texCoordOffset = heightScale * viewDir.xy * height;
			return -texCoordOffset;
		}
	#endif
#endif