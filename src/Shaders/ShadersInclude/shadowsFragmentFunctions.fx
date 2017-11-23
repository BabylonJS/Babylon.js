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

	float computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float darkness, vec2 depthValues)
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

	float computeShadowWithPCF(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float mapSize, float darkness, float frustumEdgeFalloff)
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
#endif
