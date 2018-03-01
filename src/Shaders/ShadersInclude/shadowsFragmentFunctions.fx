#ifdef SHADOWS
	#ifndef SHADOWFLOAT
		float unpack(vec4 color)
		{
			const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
			return dot(color, bit_shift);
		}
	#endif

	float computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, vec2 depthValues)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);
		depth = (depth + depthValues.x) / (depthValues.y);
		depth = clamp(depth, 0., 1.0);

		directionToLight = normalize(directionToLight);
		directionToLight.y = -directionToLight.y;
		
		#ifndef SHADOWFLOAT
			float shadow = unpack(textureCube(shadowSampler, directionToLight));
		#else
			float shadow = textureCube(shadowSampler, directionToLight).x;
		#endif

		if (depth > shadow)
		{
			return darkness;
		}
		return 1.0;
	}

	float computeShadowWithPoissonSamplingCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float darkness, vec2 depthValues)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);
		depth = (depth + depthValues.x) / (depthValues.y);
		depth = clamp(depth, 0., 1.0);

		directionToLight = normalize(directionToLight);
		directionToLight.y = -directionToLight.y;

		float visibility = 1.;

		vec3 poissonDisk[4];
		poissonDisk[0] = vec3(-1.0, 1.0, -1.0);
		poissonDisk[1] = vec3(1.0, -1.0, -1.0);
		poissonDisk[2] = vec3(-1.0, -1.0, -1.0);
		poissonDisk[3] = vec3(1.0, -1.0, 1.0);

		// Poisson Sampling

		#ifndef SHADOWFLOAT
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < depth) visibility -= 0.25;
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < depth) visibility -= 0.25;
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < depth) visibility -= 0.25;
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < depth) visibility -= 0.25;
		#else
			if (textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize).x < depth) visibility -= 0.25;
			if (textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize).x < depth) visibility -= 0.25;
			if (textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize).x < depth) visibility -= 0.25;
			if (textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize).x < depth) visibility -= 0.25;
		#endif

		return  min(1.0, visibility + darkness);
	}

	float computeShadowWithESMCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float depthScale, vec2 depthValues)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);
		depth = (depth + depthValues.x) / (depthValues.y);
		float shadowPixelDepth = clamp(depth, 0., 1.0);

		directionToLight = normalize(directionToLight);
		directionToLight.y = -directionToLight.y;
		
		#ifndef SHADOWFLOAT
			float shadowMapSample = unpack(textureCube(shadowSampler, directionToLight));
		#else
			float shadowMapSample = textureCube(shadowSampler, directionToLight).x;
		#endif

		float esm = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample, 0., 1. - darkness);	
		return esm;
	}

	float computeShadowWithCloseESMCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float depthScale, vec2 depthValues)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);
		depth = (depth + depthValues.x) / (depthValues.y);
		float shadowPixelDepth = clamp(depth, 0., 1.0);

		directionToLight = normalize(directionToLight);
		directionToLight.y = -directionToLight.y;
		
		#ifndef SHADOWFLOAT
			float shadowMapSample = unpack(textureCube(shadowSampler, directionToLight));
		#else
			float shadowMapSample = textureCube(shadowSampler, directionToLight).x;
		#endif

		float esm = clamp(exp(min(87., -depthScale * (shadowPixelDepth - shadowMapSample))), darkness, 1.);

		return esm;
	}

	float computeShadow(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float darkness, float frustumEdgeFalloff)
	{
		vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
		vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}

		float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

		#ifndef SHADOWFLOAT
			float shadow = unpack(texture2D(shadowSampler, uv));
		#else
			float shadow = texture2D(shadowSampler, uv).x;
		#endif

		if (shadowPixelDepth > shadow)
		{
			return computeFallOff(darkness, clipSpace.xy, frustumEdgeFalloff);
		}
		return 1.;
	}

	float computeShadowWithPoissonSampling(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float mapSize, float darkness, float frustumEdgeFalloff)
	{
		vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
		vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}

		float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

		float visibility = 1.;

		vec2 poissonDisk[4];
		poissonDisk[0] = vec2(-0.94201624, -0.39906216);
		poissonDisk[1] = vec2(0.94558609, -0.76890725);
		poissonDisk[2] = vec2(-0.094184101, -0.92938870);
		poissonDisk[3] = vec2(0.34495938, 0.29387760);

		// Poisson Sampling

		#ifndef SHADOWFLOAT
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
		#else
			if (texture2D(shadowSampler, uv + poissonDisk[0] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
			if (texture2D(shadowSampler, uv + poissonDisk[1] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
			if (texture2D(shadowSampler, uv + poissonDisk[2] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
			if (texture2D(shadowSampler, uv + poissonDisk[3] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
		#endif

		return computeFallOff(min(1.0, visibility + darkness), clipSpace.xy, frustumEdgeFalloff);
	}

	float computeShadowWithESM(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float darkness, float depthScale, float frustumEdgeFalloff)
	{
		vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
		vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}

		float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

		#ifndef SHADOWFLOAT
			float shadowMapSample = unpack(texture2D(shadowSampler, uv));
		#else
			float shadowMapSample = texture2D(shadowSampler, uv).x;
		#endif
		
		float esm = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample, 0., 1. - darkness);

		return computeFallOff(esm, clipSpace.xy, frustumEdgeFalloff);
	}

	float computeShadowWithCloseESM(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float darkness, float depthScale, float frustumEdgeFalloff)
	{
		vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
		vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}

		float shadowPixelDepth = clamp(depthMetric, 0., 1.0);		
		
		#ifndef SHADOWFLOAT
			float shadowMapSample = unpack(texture2D(shadowSampler, uv));
		#else
			float shadowMapSample = texture2D(shadowSampler, uv).x;
		#endif
		
		float esm = clamp(exp(min(87., -depthScale * (shadowPixelDepth - shadowMapSample))), darkness, 1.);

		return computeFallOff(esm, clipSpace.xy, frustumEdgeFalloff);
	}

	#ifdef WEBGL2
		const vec3 PCFSamplers[16] = vec3[16](
			vec3( -0.94201624, -0.39906216, 0.),
			vec3( 0.94558609, -0.76890725, 0.),
			vec3( -0.094184101, -0.92938870, 0.),
			vec3( 0.34495938, 0.29387760, 0.),
			vec3( -0.91588581, 0.45771432, 0.),
			vec3( -0.81544232, -0.87912464, 0.),
			vec3( -0.38277543, 0.27676845, 0.),
			vec3( 0.97484398, 0.75648379, 0.),
			vec3( 0.44323325, -0.97511554, 0.),
			vec3( 0.53742981, -0.47373420, 0.),
			vec3( -0.26496911, -0.41893023, 0.),
			vec3( 0.79197514, 0.19090188, 0.),
			vec3( -0.24188840, 0.99706507, 0.),
			vec3( -0.81409955, 0.91437590, 0.),
			vec3( 0.19984126, 0.78641367, 0.),
			vec3( 0.14383161, -0.14100790, 0.)
		);

		// Shadow PCF kernel size 1 with a single tap (lowest quality)
		float computeShadowWithPCF1(vec4 vPositionFromLight, sampler2DShadow shadowSampler, float darkness, float frustumEdgeFalloff)
		{
			vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
			vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

			float shadow = texture2D(shadowSampler, uvDepth);
			shadow = shadow * (1. - darkness) + darkness;
			return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
		}

		// Shadow PCF kernel 3*3 in only 4 taps (medium quality)
		// This uses a well distributed taps to allow a gaussian distribution covering a 3*3 kernel
		// https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
		float computeShadowWithPCF3(vec4 vPositionFromLight, sampler2DShadow shadowSampler, vec2 shadowMapSizeAndInverse, float darkness, float frustumEdgeFalloff)
		{
			vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
			vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

			vec2 uv = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
			uv += 0.5;											// offset of half to be in the center of the texel
			vec2 st = fract(uv);								// how far from the center
			vec2 base_uv = floor(uv) - 0.5;						// texel coord
			base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

			// Equation resolved to fit in a 3*3 distribution like 
			// 1 2 1
			// 2 4 2 
			// 1 2 1
			vec2 uvw0 = 3. - 2. * st;
			vec2 uvw1 = 1. + 2. * st;
			vec2 u = vec2((2. - st.x) / uvw0.x - 1., st.x / uvw1.x + 1.) * shadowMapSizeAndInverse.y;
			vec2 v = vec2((2. - st.y) / uvw0.y - 1., st.y / uvw1.y + 1.) * shadowMapSizeAndInverse.y;

			float shadow = 0.;
			shadow += uvw0.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[0]), uvDepth.z));
			shadow += uvw1.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[0]), uvDepth.z));
			shadow += uvw0.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[1]), uvDepth.z));
			shadow += uvw1.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[1]), uvDepth.z));
			shadow = shadow / 16.;

			shadow = shadow * (1. - darkness) + darkness;
			return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
		}
		
		// Shadow PCF kernel 5*5 in only 9 taps (high quality)
		// This uses a well distributed taps to allow a gaussian distribution covering a 5*5 kernel
		// https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
		float computeShadowWithPCF5(vec4 vPositionFromLight, sampler2DShadow shadowSampler, vec2 shadowMapSizeAndInverse, float darkness, float frustumEdgeFalloff)
		{
			vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
			vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

			vec2 uv = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
			uv += 0.5;											// offset of half to be in the center of the texel
			vec2 st = fract(uv);								// how far from the center
			vec2 base_uv = floor(uv) - 0.5;						// texel coord
			base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

			// Equation resolved to fit in a 5*5 distribution like 
			// 1 2 4 2 1
			vec2 uvw0 = 4. - 3. * st;
			vec2 uvw1 = vec2(7.);
			vec2 uvw2 = 1. + 3. * st;

			vec3 u = vec3((3. - 2. * st.x) / uvw0.x - 2., (3. + st.x) / uvw1.x, st.x / uvw2.x + 2.) * shadowMapSizeAndInverse.y;
			vec3 v = vec3((3. - 2. * st.y) / uvw0.y - 2., (3. + st.y) / uvw1.y, st.y / uvw2.y + 2.) * shadowMapSizeAndInverse.y;

			float shadow = 0.;
			shadow += uvw0.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[0]), uvDepth.z));
			shadow += uvw1.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[0]), uvDepth.z));
			shadow += uvw2.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[2], v[0]), uvDepth.z));
			shadow += uvw0.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[1]), uvDepth.z));
			shadow += uvw1.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[1]), uvDepth.z));
			shadow += uvw2.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[2], v[1]), uvDepth.z));
			shadow += uvw0.x * uvw2.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[2]), uvDepth.z));
			shadow += uvw1.x * uvw2.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[2]), uvDepth.z));
			shadow += uvw2.x * uvw2.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[2], v[2]), uvDepth.z));
			shadow = shadow / 144.;

			shadow = shadow * (1. - darkness) + darkness;
			return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
			
		}
	#endif
#endif
