#ifdef MORPHTARGETS
	uniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];

	#ifdef MORPHTARGETS_TEXTURE	
		precision mediump sampler2DArray;		
		uniform float morphTargetTextureIndices[NUM_MORPH_INFLUENCERS];
		uniform vec3 morphTargetTextureInfo;
		uniform sampler2DArray morphTargets;

        #ifndef HAS_ORIGIN_BOTTOM_LEFT
            vec3 _forceFlipY(vec3 uv) {
                return vec3(uv.x, 1.0 - uv.y, uv.z);
            }
        #else
            vec3 _forceFlipY(vec3 uv) {
                return uv;
            }
        #endif

		vec3 readVector3FromRawSampler(int targetIndex, float vertexIndex)
		{			
			float y = floor(vertexIndex / morphTargetTextureInfo.y);
			float x = vertexIndex - y * morphTargetTextureInfo.y;
			vec3 textureUV = vec3((x + 0.5) / morphTargetTextureInfo.y, (y + 0.5) / morphTargetTextureInfo.z, morphTargetTextureIndices[targetIndex]);
			return texture2D(morphTargets, _forceFlipY(textureUV)).xyz;
		}
	#endif
#endif