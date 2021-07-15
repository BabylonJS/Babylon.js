#if defined(BUMP)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_SAMPLERNAME_,bump)
#endif

#if defined(DETAIL)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_SAMPLERNAME_,detail)
#endif

#if defined(BUMP) && defined(PARALLAX)
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
			currSampledHeight = texture2D(bumpSampler, texCoord + vCurrOffset).w;

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
