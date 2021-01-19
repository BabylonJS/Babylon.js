#ifdef MORPHTARGETS
	uniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];

	#ifdef MORPHTARGETS_TEXTURE	
		precision mediump sampler2DArray;		
		uniform float morphTargetTextureIndices[NUM_MORPH_INFLUENCERS];
		uniform vec3 morphTargetTextureInfo;
		uniform sampler2DArray morphTargets;

		vec3 readVector3FromRawSampler(int targetIndex, float vertexIndex)
		{			
			float y = floor(vertexIndex / morphTargetTextureInfo.y);
			float x = vertexIndex - y * morphTargetTextureInfo.y;
			vec3 textureUV = vec3((x + 0.5) / morphTargetTextureInfo.y, (y + 0.5) / morphTargetTextureInfo.z, morphTargetTextureIndices[targetIndex]);
			return texture(morphTargets, textureUV).xyz;
		}
	#endif
#endif