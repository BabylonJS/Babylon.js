#if defined(GEOMETRY_NORMAL)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal,_SAMPLERNAME_,geometryNormal)
#endif

#if defined(DETAIL)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_SAMPLERNAME_,detail)
#endif

#if defined(GEOMETRY_NORMAL) && defined(PARALLAX)
	const minSamples: f32 = 4.;
	const maxSamples: f32 = 15.;
	const iMaxSamples: i32 = 15;

	// http://www.gamedev.net/page/resources/_/technical/graphics-programming-and-theory/a-closer-look-at-parallax-occlusion-mapping-r3262
	fn parallaxOcclusion(vViewDirCoT: vec3f, vNormalCoT: vec3f, texCoord: vec2f, parallaxScale: f32) -> vec2f {

		var parallaxLimit: f32 = length(vViewDirCoT.xy) / vViewDirCoT.z;
		parallaxLimit *= parallaxScale;
		var vOffsetDir: vec2f = normalize(vViewDirCoT.xy);
		var vMaxOffset: vec2f = vOffsetDir * parallaxLimit;
		var numSamples: f32 = maxSamples + (dot(vViewDirCoT, vNormalCoT) * (minSamples - maxSamples));
		var stepSize: f32 = 1.0 / numSamples;

		// Initialize the starting view ray height and the texture offsets.
		var currRayHeight: f32 = 1.0;
		var vCurrOffset: vec2f =  vec2f(0, 0);
		var vLastOffset: vec2f =  vec2f(0, 0);

		var lastSampledHeight: f32 = 1.0;
		var currSampledHeight: f32 = 1.0;

		var keepWorking: bool = true;
		for (var i: i32 = 0; i < iMaxSamples; i++)
		{
			currSampledHeight = textureSample(geometryNormalSampler, geometryNormalSamplerSampler, texCoord + vCurrOffset).w;

			// Test if the view ray has intersected the surface.
			if (!keepWorking)
			{
				// do nothing
			}
			else if (currSampledHeight > currRayHeight)
			{
				var delta1: f32 = currSampledHeight - currRayHeight;
				var delta2: f32 = (currRayHeight + stepSize) - lastSampledHeight;
				var ratio: f32 = delta1 / (delta1 + delta2);
				vCurrOffset = (ratio)* vLastOffset + (1.0 - ratio) * vCurrOffset;

				keepWorking = false;
			}
			else
			{
				currRayHeight -= stepSize;
				vLastOffset = vCurrOffset;
			#ifdef PARALLAX_RHS
				vCurrOffset -= stepSize * vMaxOffset;
			#else
				vCurrOffset += stepSize * vMaxOffset;
			#endif

				lastSampledHeight = currSampledHeight;
			}
		}

		return vCurrOffset;
	}

	fn parallaxOffset(viewDir: vec3f, heightScale: f32) -> vec2f
	{
		// calculate amount of offset for Parallax Mapping With Offset Limiting
		var height: f32 = textureSample(geometryNormalSampler, geometryNormalSamplerSampler, fragmentInputs.vGeometryNormalUV).w;
		var texCoordOffset: vec2f = heightScale * viewDir.xy * height;
	#ifdef PARALLAX_RHS
		return texCoordOffset;
	#else
		return -texCoordOffset;
	#endif
	}
#endif
