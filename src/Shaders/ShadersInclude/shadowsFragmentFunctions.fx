#ifdef SHADOWS
	#ifndef SHADOWFULLFLOAT
		float unpack(vec4 color)
		{
			const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
			return dot(color, bit_shift);
		}
	#endif

	uniform vec2 depthValues;

	float computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);
		depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
		depth = clamp(depth, 0., 1.0);

		directionToLight = normalize(directionToLight);
		directionToLight.y = -directionToLight.y;
		
		#ifndef SHADOWFULLFLOAT
			float shadow = unpack(textureCube(shadowSampler, directionToLight));
		#else
			float shadow = textureCube(shadowSampler, directionToLight).x;
		#endif

		if (depth > shadow)
		{
			#ifdef OVERLOADEDSHADOWVALUES
                return mix(1.0, darkness, vOverloadedShadowIntensity.x);
            #else
                return darkness;
            #endif
		}
		return 1.0;
	}

	float computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float darkness)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);

		depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
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

		#ifndef SHADOWFULLFLOAT
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

		#ifdef OVERLOADEDSHADOWVALUES
            return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));
        #else
            return  min(1.0, visibility + darkness);
        #endif
	}

	float computeShadowWithESMCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float depthScale)
	{
		vec3 directionToLight = vPositionW - lightPosition;
		float depth = length(directionToLight);
		depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
		float shadowPixelDepth = clamp(depth, 0., 1.0);

		directionToLight = normalize(directionToLight);
		directionToLight.y = -directionToLight.y;
		
		#ifndef SHADOWFULLFLOAT
			float shadowMapSample = unpack(textureCube(shadowSampler, directionToLight));
		#else
			float shadowMapSample = textureCube(shadowSampler, directionToLight).x;
		#endif

		float esm = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample - darkness, 0., 1.);	
		#ifdef OVERLOADEDSHADOWVALUES
			return mix(1.0, esm, vOverloadedShadowIntensity.x);
		#else
			return esm;
		#endif
	}

	float computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness)
	{
		vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
		depth = 0.5 * depth + vec3(0.5);
		vec2 uv = depth.xy;

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}

		#ifndef SHADOWFULLFLOAT
			float shadow = unpack(texture2D(shadowSampler, uv));
		#else
			float shadow = texture2D(shadowSampler, uv).x;
		#endif

		if (depth.z > shadow)
		{
			#ifdef OVERLOADEDSHADOWVALUES
                return mix(1.0, darkness, vOverloadedShadowIntensity.x);
            #else
                return darkness;
            #endif
		}
		return 1.;
	}

	float computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float darkness)
	{
		vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
		depth = 0.5 * depth + vec3(0.5);
		vec2 uv = depth.xy;

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}

		float visibility = 1.;

		vec2 poissonDisk[4];
		poissonDisk[0] = vec2(-0.94201624, -0.39906216);
		poissonDisk[1] = vec2(0.94558609, -0.76890725);
		poissonDisk[2] = vec2(-0.094184101, -0.92938870);
		poissonDisk[3] = vec2(0.34495938, 0.29387760);

		// Poisson Sampling

		#ifndef SHADOWFULLFLOAT
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < depth.z) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < depth.z) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < depth.z) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < depth.z) visibility -= 0.25;
		#else
			if (texture2D(shadowSampler, uv + poissonDisk[0] * mapSize).x < depth.z) visibility -= 0.25;
			if (texture2D(shadowSampler, uv + poissonDisk[1] * mapSize).x < depth.z) visibility -= 0.25;
			if (texture2D(shadowSampler, uv + poissonDisk[2] * mapSize).x < depth.z) visibility -= 0.25;
			if (texture2D(shadowSampler, uv + poissonDisk[3] * mapSize).x < depth.z) visibility -= 0.25;
		#endif
		
        #ifdef OVERLOADEDSHADOWVALUES
            return  mix(1.0, min(1.0, visibility + darkness), vOverloadedShadowIntensity.x);
        #else
            return  min(1.0, visibility + darkness);
        #endif
	}

	float computeShadowWithESM(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float depthScale)
	{
		vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
		vec3 depth = 0.5 * clipSpace + vec3(0.5);
		vec2 uv = depth.xy;
		float shadowPixelDepth = depth.z;

		if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
		{
			return 1.0;
		}
	
		#ifndef SHADOWFULLFLOAT
			float shadowMapSample = unpack(texture2D(shadowSampler, uv));
		#else
			float shadowMapSample = texture2D(shadowSampler, uv).x;
		#endif
		
		float esm = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample - darkness, 0., 1.);		

		// Apply fade out at frustum edge
		// const float fadeDistance = 0.07;
		// vec2 cs2 = clipSpace.xy * clipSpace.xy; //squarish falloff
		// float mask = smoothstep(1.0, 1.0 - fadeDistance, dot(cs2, cs2));

		// esm = mix(1.0, esm, mask);

		#ifdef OVERLOADEDSHADOWVALUES
            return mix(1.0, esm, vOverloadedShadowIntensity.x);
        #else
            return esm;
        #endif
	}
#endif