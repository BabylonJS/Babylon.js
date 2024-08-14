// SSAO 2 Shader
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

#ifdef SSAO
	const scales: array<f32, 16> = array<f32, 16>(
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

	var depthSamplerSampler: sampler;
	var depthSampler: texture_2d<f32>;
	var randomSamplerSampler: sampler;
	var randomSampler: texture_2d<f32>;
	var normalSamplerSampler: sampler;
	var normalSampler: texture_2d<f32>;

	uniform randTextureTiles: f32;
	uniform samplesFactor: f32;
	uniform sampleSphere: array<vec3f, SAMPLES>;

	uniform totalStrength: f32;
	uniform base: f32;
	uniform xViewport: f32;
	uniform yViewport: f32;
	uniform depthProjection: mat3x3f;
	uniform maxZ: f32;
	uniform minZAspect: f32;
	uniform texelSize: vec2f;

	uniform projection: mat4x4f;

	@fragment
	fn main(input: FragmentInputs) -> FragmentOutputs {
		var random: vec3f = textureSampleLevel(randomSampler, randomSamplerSampler, input.vUV * uniforms.randTextureTiles, 0.0).rgb;
		var depth: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, input.vUV, 0.0).r;
		var depthSign: f32 = sign(depth);
		depth = depth * depthSign;
		var normal: vec3f = textureSampleLevel(normalSampler, normalSamplerSampler, input.vUV, 0.0).rgb;
		var occlusion: f32 = 0.0;
		var correctedRadius: f32 = min(uniforms.radius, uniforms.minZAspect * depth / uniforms.near);

		var vViewRay: vec3f =  vec3f((input.vUV.x * 2.0 - 1.0)*uniforms.xViewport, (input.vUV.y * 2.0 - 1.0)*uniforms.yViewport, depthSign);
		var vDepthFactor: vec3f = uniforms.depthProjection *  vec3f(1.0, 1.0, depth);
		var origin: vec3f = vViewRay * vDepthFactor;
		var rvec: vec3f = random * 2.0 - 1.0;
		rvec.z = 0.0;

		// Avar numerical: voidnull precision issue while applying Gram-Schmidt
		var dotProduct: f32 = dot(rvec, normal);
		rvec = select( vec3f(-rvec.y, 0.0, rvec.x), rvec,1.0 - abs(dotProduct) > 1e-2);
		var tangent: vec3f = normalize(rvec - normal * dot(rvec, normal));
		var bitangent: vec3f = cross(normal, tangent);
		var tbn: mat3x3f =  mat3x3f(tangent, bitangent, normal);

		var difference: f32;

		for (var i: i32 = 0; i < SAMPLES; i++) {
			// get sample position:
		    var samplePosition: vec3f = scales[(i +  i32(random.x * 16.0)) % 16] * tbn * uniforms.sampleSphere[(i +  i32(random.y * 16.0)) % 16];
		    samplePosition = samplePosition * correctedRadius + origin;

			// project sample position:
		    var offset: vec4f =  vec4f(samplePosition, 1.0);
		    offset = uniforms.projection * offset;

		    offset = vec4f(offset.xyz / offset.w, offset.w);
			offset = vec4f(offset.xy * 0.5 + 0.5, offset.z, offset.w);

		    if (offset.x < 0.0 || offset.y < 0.0 || offset.x > 1.0 || offset.y > 1.0) {
		        continue;
		    }

			// get sample linearDepth:
		    var sampleDepth: f32 = abs(textureSampleLevel(depthSampler, depthSamplerSampler, offset.xy, 0.0).r);
			// range check & accumulate:
		    difference = depthSign * samplePosition.z - sampleDepth;

			// Ignore samples that has a diff < 0 since they are behind our
			// povar and: i32 can't be occluding it. Also ignore diff smaller than
			// Epsilon due to accuracy issues, otherwise we will get a ton of
			// incorrect occlusions with low sample counts.
		    var rangeCheck: f32 = 1.0 - smoothstep(correctedRadius*0.5, correctedRadius, difference);
		    occlusion += step(EPSILON, difference) * rangeCheck;
		}
		occlusion = occlusion*(1.0 - smoothstep(uniforms.maxZ * 0.75, uniforms.maxZ, depth));
		var ao: f32 = 1.0 - uniforms.totalStrength * occlusion * uniforms.samplesFactor;
		var result: f32 = clamp(ao + uniforms.base, 0.0, 1.0);
		fragmentOutputs.color =  vec4f( vec3f(result), 1.0);
	}
#else

	#ifdef BLUR
		uniform outSize: f32;

		// These three controls the non-legacy bilateral filter
		uniform soften: f32;
		uniform tolerance: f32;
		uniform samples: i32;

	#ifndef BLUR_BYPASS
		var depthSamplerSampler: sampler;
		var depthSampler: texture_2d<f32>;
	#ifdef BLUR_LEGACY
	
		fn blur13Bilateral(image: texture_2d<f32>, imageSampler: sampler, uv: vec2f, step: vec2f) -> f32 {
			var result: f32 = 0.0;
			var off1: vec2f =  vec2f(1.411764705882353) * step;
			var off2: vec2f =  vec2f(3.2941176470588234) * step;
			var off3: vec2f =  vec2f(5.176470588235294) * step;

			var compareDepth: f32 = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv, 0.0).r);
			var sampleDepth: f32;
			var weight: f32;
			var weightSum: f32 = 30.0;

			result += textureSampleLevel(image, imageSampler,uv, 0.0).r * 30.0;

			sampleDepth = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv + off1, 0.0).r);
			weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
			weightSum +=  weight;
			result += textureSampleLevel(image, imageSampler, uv + off1, 0.0).r * weight;

			sampleDepth = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv - off1, 0.0).r);
			weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
			weightSum +=  weight;
			result += textureSampleLevel(image, imageSampler, uv - off1, 0.0).r * weight;

			sampleDepth = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv + off2, 0.0).r);
			weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
			weightSum += weight;
			result += textureSampleLevel(image, imageSampler, uv + off2, 0.0).r * weight;

			sampleDepth = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv - off2, 0.0).r);
			weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
			weightSum += weight;
			result += textureSampleLevel(image, imageSampler, uv - off2, 0.0).r * weight;

			sampleDepth = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv + off3, 0.0).r);
			weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
			weightSum += weight;
			result += textureSampleLevel(image, imageSampler, uv + off3, 0.0).r * weight;

			sampleDepth = abs(textureSampleLevel(depthSampler, depthSamplerSampler, uv - off3, 0.0).r);
			weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
			weightSum += weight;
			result += textureSampleLevel(image, imageSampler, uv - off3, 0.0).r * weight;

			return result / weightSum;
		}
	#endif
	#endif

		@fragment
		fn main(input: FragmentInputs) -> FragmentOutputs {
			var result: f32 = 0.0;
			#ifdef BLUR_BYPASS
				result = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0).r;
			#else
				#ifdef BLUR_H
					var step: vec2f =  vec2f(1.0 / uniforms.outSize, 0.0);
				#else
					var step: vec2f =  vec2f(0.0, 1.0 / uniforms.outSize);
				#endif

				#ifdef BLUR_LEGACY
					result = blur13Bilateral(textureSampler, textureSamplerSampler, input.vUV, step);
				#else
					var compareDepth: f32 = abs(textureSampleLevel(depthSampler, depthSamplerSampler, input.vUV, 0.0).r);
					var weightSum: f32 = 0.0;
					for (var i: i32 = -uniforms.samples; i < uniforms.samples; i += 2)
					{
						// Step over the texels two at a time, sampling both by sampling the position
						// directly between them. The graphics hardware will thus read both.
						//
						// Note that we really should sample the center position seperately, but to
						// minimize the risk of regressions, we keep doing it like this for now.
						var samplePos: vec2f = input.vUV + step * ( f32(i) + 0.5);

						var sampleDepth: f32 = abs(textureSampleLevel(depthSampler, depthSamplerSampler, samplePos, 0.0).r);

						// The falloff is used to optionally give samples further from the center
						// gradually lower weights. The value at the center is always 1.0, but the
						// value at the edge varies depending on the "soften" control input.
						//
						// Note: soften === 0 => fallof === 1 for all i, legacy that needs to be kept.
						var falloff: f32 = smoothstep(0.0,
													f32(uniforms.samples),
													f32(uniforms.samples) - abs( f32(i)) * uniforms.soften);

						// minDivider affects how much a sample's depth need to differ before it is
						// more or less rejected. A higher value results in the bilateral filter
						// being more forgiving when rejecting samples, letting the denoiser work on
						// slanted and curved surfaces.
						//
						// Note: tolerance === 0 => minDivider === 0.003, legacy that needs to be kept.
						var minDivider: f32 = uniforms.tolerance * 0.5 + 0.003;
						var weight: f32 = falloff / ( minDivider + abs(compareDepth - sampleDepth));

						result += textureSampleLevel(textureSampler, textureSamplerSampler, samplePos, 0.0).r * weight;
						weightSum += weight;
					}
					result /= weightSum;
				#endif
			#endif

			fragmentOutputs.color = vec4f(result, result, result, 1.0);
		}

	#endif
#endif
