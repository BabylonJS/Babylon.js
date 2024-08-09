// SSAO 2 Shader
precision highp float;
uniform sampler2D textureSampler;
varying vUV: vec2f;

#ifdef SSAO
	var scales: f32[16] = float[16](
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

	uniform near: f32;
	uniform radius: f32;

	uniform sampler2D depthSampler;
	uniform sampler2D randomSampler;
	uniform sampler2D normalSampler;

	uniform randTextureTiles: f32;
	uniform samplesFactor: f32;
	uniform sampleSphere: vec3f[SAMPLES];

	uniform totalStrength: f32;
	uniform base: f32;
	uniform xViewport: f32;
	uniform yViewport: f32;
	uniform depthProjection: mat3x3f;
	uniform maxZ: f32;
	uniform minZAspect: f32;
	uniform texelSize: vec2f;

	uniform projection: mat4x4f;

	fn main()
	{
		var random: vec3f = textureLod(randomSampler, vUV * randTextureTiles, 0.0).rgb;
		var depth: f32 = textureLod(depthSampler, vUV, 0.0).r;
		var depthSign: f32 = sign(depth);
		depth = depth * depthSign;
		var normal: vec3f = textureLod(normalSampler, vUV, 0.0).rgb;
		var occlusion: f32 = 0.0;
		var correctedRadius: f32 = min(radius, minZAspect * depth / near);

		var vViewRay: vec3f =  vec3f((vUV.x * 2.0 - 1.0)*xViewport, (vUV.y * 2.0 - 1.0)*yViewport, depthSign);
		var vDepthFactor: vec3f = depthProjection *  vec3f(1.0, 1.0, depth);
		var origin: vec3f = vViewRay * vDepthFactor;
		var rvec: vec3f = random * 2.0 - 1.0;
		rvec.z = 0.0;

		// Avar numerical: voidnull precision issue while applying Gram-Schmidt
		var dotProduct: f32 = dot(rvec, normal);
		rvec = 1.0 - abs(dotProduct) > 1e-2 ? rvec :  vec3f(-rvec.y, 0.0, rvec.x);
		var tangent: vec3f = normalize(rvec - normal * dot(rvec, normal));
		var bitangent: vec3f = cross(normal, tangent);
		var tbn: mat3x3f =  mat3x3f(tangent, bitangent, normal);

		var difference: f32;

		for (var i: i32 = 0; i < SAMPLES; ++i) {
			// get sample position:
		    var samplePosition: vec3f = scales[(i +  i32(random.x * 16.0)) % 16] * tbn * sampleSphere[(i +  i32(random.y * 16.0)) % 16];
		    samplePosition = samplePosition * correctedRadius + origin;

			// project sample position:
		    var offset: vec4f =  vec4f(samplePosition, 1.0);
		    offset = projection * offset;
		    offset.xyz /= offset.w;
		    offset.xy = offset.xy * 0.5 + 0.5;

		    if (offset.x < 0.0 || offset.y < 0.0 || offset.x > 1.0 || offset.y > 1.0) {
		        continue;
		    }

			// get sample linearDepth:
		    var sampleDepth: f32 = abs(textureLod(depthSampler, offset.xy, 0.0).r);
			// range check & accumulate:
		    difference = depthSign * samplePosition.z - sampleDepth;

			// Ignore samples that has a diff < 0 since they are behind our
			// povar and: i32 can't be occluding it. Also ignore diff smaller than
			// Epsilon due to accuracy issues, otherwise we will get a ton of
			// incorrect occlusions with low sample counts.
		    var rangeCheck: f32 = 1.0 - smoothstep(correctedRadius*0.5, correctedRadius, difference);
		    occlusion += step(EPSILON, difference) * rangeCheck;
		}
		occlusion = occlusion*(1.0 - smoothstep(maxZ * 0.75, maxZ, depth));
		var ao: f32 = 1.0 - totalStrength * occlusion * samplesFactor;
		var result: f32 = clamp(ao + base, 0.0, 1.0);
		fragmentOutputs.color =  vec4f( vec3f(result), 1.0);
	}
#endif

#ifdef BLUR
	uniform outSize: f32;

	// These three controls the non-legacy bilateral filter
	uniform soften: f32;
	uniform tolerance: f32;
	uniform samples: i32;

#ifndef BLUR_BYPASS
	uniform sampler2D depthSampler;
#ifdef BLUR_LEGACY
    #define inline
	fn blur13Bilateral(sampler2D image, uv: vec2f, step: vec2f) -> f32 {
		var result: f32 = 0.0;
		var off1: vec2f =  vec2f(1.411764705882353) * step;
		var off2: vec2f =  vec2f(3.2941176470588234) * step;
		var off3: vec2f =  vec2f(5.176470588235294) * step;

		var compareDepth: f32 = abs(textureLod(depthSampler, uv, 0.0).r);
		var sampleDepth: f32;
		var weight: f32;
		var weightSum: f32 = 30.0;

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

	fn main()
	{
		var result: f32 = 0.0;
		#ifdef BLUR_BYPASS
			result = textureLod(textureSampler, vUV, 0.0).r;
		#else
			#ifdef BLUR_H
				var step: vec2f =  vec2f(1.0 / outSize, 0.0);
			#else
				var step: vec2f =  vec2f(0.0, 1.0 / outSize);
			#endif

			#ifdef BLUR_LEGACY
				result = blur13Bilateral(textureSampler, vUV, step);
			#else
				var compareDepth: f32 = abs(textureLod(depthSampler, vUV, 0.0).r);
				var weightSum: f32 = 0.0;
				for (var i: i32 = -samples; i < samples; i += 2)
				{
					// Step over the texels two at a time, sampling both by sampling the position
					// directly between them. The graphics hardware will thus read both.
					//
					// Note that we really should sample the center position seperately, but to
					// minimize the risk of regressions, we keep doing it like this for now.
					var samplePos: vec2f = vUV + step * ( f32(i) + 0.5);

					var sampleDepth: f32 = abs(textureLod(depthSampler, samplePos, 0.0).r);

					// The falloff is used to optionally give samples further from the center
					// gradually lower weights. The value at the center is always 1.0, but the
					// value at the edge varies depending on the "soften" control input.
					//
					// Note: soften === 0 => fallof === 1 for all i, legacy that needs to be kept.
					var falloff: f32 = smoothstep(0.0,
											    f32(samples),
											    f32(samples) - abs( f32(i)) * soften);

					// minDivider affects how much a sample's depth need to differ before it is
					// more or less rejected. A higher value results in the bilateral filter
					// being more forgiving when rejecting samples, letting the denoiser work on
					// slanted and curved surfaces.
					//
					// Note: tolerance === 0 => minDivider === 0.003, legacy that needs to be kept.
					var minDivider: f32 = tolerance * 0.5 + 0.003;
					var weight: f32 = falloff / ( minDivider + abs(compareDepth - sampleDepth));

					result += textureLod(textureSampler, samplePos, 0.0).r * weight;
					weightSum += weight;
				}
				result /= weightSum;
			#endif
		#endif

		fragmentOutputs.color.rgb =  vec3f(result);
		fragmentOutputs.color.a = 1.0;
	}

#endif
