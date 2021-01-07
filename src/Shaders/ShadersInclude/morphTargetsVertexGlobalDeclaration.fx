#ifdef MORPHTARGETS
	uniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];

	#ifdef MORPHTARGETS_TEXTURE	
		uniform vec3 morphTargetTextureInfo;
		uniform sampler2D morphTargets[NUM_MORPH_INFLUENCERS];

		vec3 readVector3FromRawSampler(sampler2D smp, float vertexIndex)
		{			
			float y = floor(vertexIndex / morphTargetTextureInfo.y);
			float x = vertexIndex - y * morphTargetTextureInfo.y;
			vec2 textureUV = vec2((x + 0.5) / morphTargetTextureInfo.y, y / morphTargetTextureInfo.z);
			return texture2D(smp, textureUV).xyz;
		}
	#endif
#endif