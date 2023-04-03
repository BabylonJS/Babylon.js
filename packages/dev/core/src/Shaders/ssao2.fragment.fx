// SSAO 2 Shader
precision highp float;
uniform sampler2D textureSampler;
varying vec2 vUV;

#ifdef SSAO
	float scales[16] = float[16](
	0.1,
	0.11406250000000001,
	0.131640625,
	0.15625,
	0.187890625,
	0.2265625,
	0.272265625,
	0.325,
	0.384765625,
	0.4515625,
	0.525390625,
	0.60625,
	0.694140625,
	0.7890625,
	0.891015625,
	1.0
	);

	uniform float near;
	uniform float radius;

	uniform sampler2D depthSampler;
	uniform sampler2D randomSampler;
	uniform sampler2D normalSampler;

	uniform float randTextureTiles;
	uniform float samplesFactor;
	uniform vec3 sampleSphere[SAMPLES];

	uniform float totalStrength;
	uniform float base;
	uniform float xViewport;
	uniform float yViewport;
	uniform mat3 depthProjection;
	uniform float maxZ;
	uniform float minZAspect;
	uniform vec2 texelSize;

	uniform mat4 projection;

	void main()
	{
		vec3 random = textureLod(randomSampler, vUV * randTextureTiles, 0.0).rgb;
		float depth = textureLod(depthSampler, vUV, 0.0).r;
		float depthSign = depth / abs(depth);
		depth = depth * depthSign;
		vec3 normal = textureLod(normalSampler, vUV, 0.0).rgb;
		float occlusion = 0.0;
		float correctedRadius = min(radius, minZAspect * depth / near);

		vec3 vViewRay = vec3((vUV.x * 2.0 - 1.0)*xViewport, (vUV.y * 2.0 - 1.0)*yViewport, depthSign);
		vec3 vDepthFactor = depthProjection * vec3(1.0, 1.0, depth);
		vec3 origin = vViewRay * vDepthFactor;
		vec3 rvec = random * 2.0 - 1.0;
		rvec.z = 0.0;

		// Avoid numerical precision issue while applying Gram-Schmidt
		float dotProduct = dot(rvec, normal);
		rvec = 1.0 - abs(dotProduct) > 1e-2 ? rvec : vec3(-rvec.y, 0.0, rvec.x);
		vec3 tangent = normalize(rvec - normal * dot(rvec, normal));
		vec3 bitangent = cross(normal, tangent);
		mat3 tbn = mat3(tangent, bitangent, normal);

		float difference;

		for (int i = 0; i < SAMPLES; ++i) {
			// get sample position:
		    vec3 samplePosition = scales[(i + int(random.x * 16.0)) % 16] * tbn * sampleSphere[(i + int(random.y * 16.0)) % 16];
		    samplePosition = samplePosition * correctedRadius + origin;

			// project sample position:
		    vec4 offset = vec4(samplePosition, 1.0);
		    offset = projection * offset;
		    offset.xyz /= offset.w;
		    offset.xy = offset.xy * 0.5 + 0.5;

		    if (offset.x < 0.0 || offset.y < 0.0 || offset.x > 1.0 || offset.y > 1.0) {
		        continue;
		    }

			// get sample linearDepth:
		    float sampleDepth = abs(textureLod(depthSampler, offset.xy, 0.0).r);
			// range check & accumulate:
		    difference = depthSign * samplePosition.z - sampleDepth;

			// Ignore samples that has a diff < 0 since they are behind our
			// point and can't be occluding it. Also ignore diff smaller than
			// Epsilon due to accuracy issues, otherwise we will get a ton of
			// incorrect occlusions with low sample counts.
		    float rangeCheck = 1.0 - smoothstep(correctedRadius*0.5, correctedRadius, difference);
		    occlusion += step(EPSILON, difference) * rangeCheck;
		}
		occlusion = occlusion*(1.0 - smoothstep(maxZ * 0.75, maxZ, depth));
		float ao = 1.0 - totalStrength * occlusion * samplesFactor;
		float result = clamp(ao + base, 0.0, 1.0);
		gl_FragColor = vec4(vec3(result), 1.0);
	}
#endif

#ifdef BLUR
	uniform float outSize;

	// These three controls the non-legacy bilateral filter
	uniform float soften;
	uniform float tolerance;
	uniform int samples;

#ifndef BLUR_BYPASS
	uniform sampler2D depthSampler;
#ifdef BLUR_LEGACY
    #define inline
	float blur13Bilateral(sampler2D image, vec2 uv, vec2 step) {
		float result = 0.0;
		vec2 off1 = vec2(1.411764705882353) * step;
		vec2 off2 = vec2(3.2941176470588234) * step;
		vec2 off3 = vec2(5.176470588235294) * step;

		float compareDepth = abs(textureLod(depthSampler, uv, 0.0).r);
		float sampleDepth;
		float weight;
		float weightSum = 30.0;

		result += textureLod(image, uv, 0.0).r * 30.0;

		sampleDepth = abs(textureLod(depthSampler, uv + off1, 0.0).r);
		weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
		weightSum +=  weight;
		result += textureLod(image, uv + off1, 0.0).r * weight;

		sampleDepth = abs(textureLod(depthSampler, uv - off1, 0.0).r);
		weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
		weightSum +=  weight;
		result += textureLod(image, uv - off1, 0.0).r * weight;

		sampleDepth = abs(textureLod(depthSampler, uv + off2, 0.0).r);
		weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
		weightSum += weight;
		result += textureLod(image, uv + off2, 0.0).r * weight;

		sampleDepth = abs(textureLod(depthSampler, uv - off2, 0.0).r);
		weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
		weightSum += weight;
		result += textureLod(image, uv - off2, 0.0).r * weight;

		sampleDepth = abs(textureLod(depthSampler, uv + off3, 0.0).r);
		weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
		weightSum += weight;
		result += textureLod(image, uv + off3, 0.0).r * weight;

		sampleDepth = abs(textureLod(depthSampler, uv - off3, 0.0).r);
		weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
		weightSum += weight;
		result += textureLod(image, uv - off3, 0.0).r * weight;

		return result / weightSum;
	}
#endif
#endif

	void main()
	{
		float result = 0.0;
		#ifdef BLUR_BYPASS
			result = textureLod(textureSampler, vUV, 0.0).r;
		#else
			#ifdef BLUR_H
				vec2 step = vec2(1.0 / outSize, 0.0);
			#else
				vec2 step = vec2(0.0, 1.0 / outSize);
			#endif

			#ifdef BLUR_LEGACY
				result = blur13Bilateral(textureSampler, vUV, step);
			#else
				float compareDepth = abs(textureLod(depthSampler, vUV, 0.0).r);
				float weightSum = 0.0;
				for (int i = -samples; i < samples; i += 2)
				{
					// Step over the texels two at a time, sampling both by sampling the position
					// directly between them. The graphics hardware will thus read both.
					//
					// Note that we really should sample the center position seperately, but to
					// minimize the risk of regressions, we keep doing it like this for now.
					vec2 samplePos = vUV + step * (float(i) + 0.5);

					float sampleDepth = abs(textureLod(depthSampler, samplePos, 0.0).r);

					// The falloff is used to optionally give samples further from the center
					// gradually lower weights. The value at the center is always 1.0, but the
					// value at the edge varies depending on the "soften" control input.
					//
					// Note: soften === 0 => fallof === 1 for all i, legacy that needs to be kept.
					float falloff = smoothstep(0.0,
											   float(samples),
											   float(samples) - abs(float(i)) * soften);

					// minDivider affects how much a sample's depth need to differ before it is
					// more or less rejected. A higher value results in the bilateral filter
					// being more forgiving when rejecting samples, letting the denoiser work on
					// slanted and curved surfaces.
					//
					// Note: tolerance === 0 => minDivider === 0.003, legacy that needs to be kept.
					float minDivider = tolerance * 0.5 + 0.003;
					float weight = falloff / ( minDivider + abs(compareDepth - sampleDepth));

					result += textureLod(textureSampler, samplePos, 0.0).r * weight;
					weightSum += weight;
				}
				result /= weightSum;
			#endif
		#endif

		gl_FragColor.rgb = vec3(result);
		gl_FragColor.a = 1.0;
	}

#endif
