﻿#ifdef SHADOWS
	float unpack(vec4 color)
	{
		const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
		return dot(color, bit_shift);
	}

	#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)
		uniform vec2 depthValues;

		float computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)
		{
			vec3 directionToLight = vPositionW - lightPosition;
			float depth = length(directionToLight);
			depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
			depth = clamp(depth, 0., 1.0);

			directionToLight = normalize(directionToLight);
			directionToLight.y = -directionToLight.y;

			float shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;

			if (depth > shadow)
			{
				return darkness;
			}
			return 1.0;
		}

		float computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)
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
			float biasedDepth = depth - bias;

			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;
			if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;

			return  min(1.0, visibility + darkness);
		}
	#endif

	#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)
		float computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)
		{
			vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
			depth = 0.5 * depth + vec3(0.5);
			vec2 uv = depth.xy;

			if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
			{
				return 1.0;
			}

			float shadow = unpack(texture2D(shadowSampler, uv)) + bias;

			if (depth.z > shadow)
			{
				return darkness;
			}
			return 1.;
		}

		float computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)
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
			float biasedDepth = depth.z - bias;

			if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;
			if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;

			return  min(1.0, visibility + darkness);
		}

		// Thanks to http://devmaster.net/
		float unpackHalf(vec2 color)
		{
			return color.x + (color.y / 255.0);
		}

		float linstep(float low, float high, float v) {
			return clamp((v - low) / (high - low), 0.0, 1.0);
		}

		float ChebychevInequality(vec2 moments, float compare, float bias)
		{
			float p = smoothstep(compare - bias, compare, moments.x);
			float variance = max(moments.y - moments.x * moments.x, 0.02);
			float d = compare - moments.x;
			float p_max = linstep(0.2, 1.0, variance / (variance + d * d));

			return clamp(max(p, p_max), 0.0, 1.0);
		}

		float computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)
		{
			vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;
			depth = 0.5 * depth + vec3(0.5);
			vec2 uv = depth.xy;

			if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)
			{
				return 1.0;
			}

			vec4 texel = texture2D(shadowSampler, uv);

			vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));
			return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);
		}
	#endif
#endif