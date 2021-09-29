#ifdef MORPHTARGETS
	uniform morphTargetInfluences : array<f32, NUM_MORPH_INFLUENCERS>;

	#ifdef MORPHTARGETS_TEXTURE	
		uniform morphTargetTextureIndices : array<f32, NUM_MORPH_INFLUENCERS>;
		uniform morphTargetTextureInfo : vec3<f32>;

		var morphTargets : texture_2d_array<f32>;
        var morphTargetsSampler : sampler;

		fn readVector3FromRawSampler(targetIndex : i32, vertexIndex : f32) -> vec3<f32>
		{			
			let y = floor(vertexIndex / uniforms.morphTargetTextureInfo.y);
			let x = vertexIndex - y * uniforms.morphTargetTextureInfo.y;
			let textureUV = vec2<f32>((x + 0.5) / uniforms.morphTargetTextureInfo.y, (y + 0.5) / uniforms.morphTargetTextureInfo.z);
			return textureSampleLevel(morphTargets, morphTargetsSampler, textureUV, i32(uniforms.morphTargetTextureIndices[targetIndex]), 0.0).xyz;
		}
	#endif
#endif