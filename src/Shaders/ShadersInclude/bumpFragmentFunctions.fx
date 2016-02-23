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

	vec3 perturbNormal(vec3 viewDir, mat3 cotangentFrame, vec2 uv)
	{
		vec3 map = texture2D(bumpSampler, uv).xyz;
		map = map * 255. / 127. - 128. / 127.;
		return normalize(cotangentFrame * map);
	}

#ifdef PARALLAX
	uniform float vParallaxScaleBias;

	const float minSamples = 4.;
	const float maxSamples = 15.;
	const int iMaxSamples = 15;

	// http://www.gamedev.net/page/resources/_/technical/graphics-programming-and-theory/a-closer-look-at-parallax-occlusion-mapping-r3262
	vec2 parallaxOcclusion(vec3 vViewDirCoT, vec3 vNormalCoT, vec2 texCoord, float parallaxScale) {

		// Calculate the parallax offset vector max length.
		// This is equivalent to the tangent of the angle between the
		// viewer position and the fragment location.
		float parallaxLimit = length(vViewDirCoT.xy) / vViewDirCoT.z;

		// Scale the parallax limit according to heightmap scale.
		parallaxLimit *= parallaxScale;

		// Calculate the parallax offset vector direction and maximum offset.
		vec2 vOffsetDir = normalize(vViewDirCoT.xy);
		vec2 vMaxOffset = vOffsetDir * parallaxLimit;

		// Calculate how many samples should be taken along the view ray
		// to find the surface intersection.  This is based on the angle
		// between the surface normal and the view vector.
		float numSamples = maxSamples + (dot(vViewDirCoT, vNormalCoT) * (minSamples - maxSamples));

		// Specify the view ray step size.  Each sample will shift the current
		// view ray by this amount.
		float stepSize = 1.0 / numSamples;

		// Calculate the texture coordinate partial derivatives in screen
		// space for the tex2Dgrad texture sampling instruction.
		//vec2 dx = dFdx(vBumpUV);			// Uncomment whevener GL_EXT_shader_texture_lod with texture2DGradEXT will work
		//vec2 dy = dFdy(vBumpUV);

		// Initialize the starting view ray height and the texture offsets.
		float currRayHeight = 1.0;
		vec2 vCurrOffset = vec2(0, 0);
		vec2 vLastOffset = vec2(0, 0);

		float lastSampledHeight = 1.0;
		float currSampledHeight = 1.0;

		for (int i = 0; i < iMaxSamples; i++)
		{
			// Sample the heightmap at the current texcoord offset.  The heightmap 
			// is stored in the alpha channel of the height/normal map.
			currSampledHeight = texture2D(bumpSampler, vBumpUV + vCurrOffset).w;

			// Uncomment whevener GL_EXT_shader_texture_lod with texture2DGradEXT will work
			//currSampledHeight = texture2DGradEXT(bumpSampler, vBumpUV + vCurrOffset, dx, dy).w;	

			// Test if the view ray has intersected the surface.
			if (currSampledHeight > currRayHeight)
			{
				// Find the relative height delta before and after the intersection.
				// This provides a measure of how close the intersection is to 
				// the final sample location.
				float delta1 = currSampledHeight - currRayHeight;
				float delta2 = (currRayHeight + stepSize) - lastSampledHeight;
				float ratio = delta1 / (delta1 + delta2);

				// Interpolate between the final two segments to 
				// find the true intersection point offset.
				vCurrOffset = (ratio)* vLastOffset + (1.0 - ratio) * vCurrOffset;

				// Force the exit of the loop
				break;
			}
			else
			{
				// take the next view ray height step,
				currRayHeight -= stepSize;

				// save the current texture coordinate offset and increment
				// to the next sample location, 
				vLastOffset = vCurrOffset;
				vCurrOffset += stepSize * vMaxOffset;

				// and finally save the current heightmap height.
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