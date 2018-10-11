#if NUM_BONE_INFLUENCERS > 0
	#ifdef BONETEXTURE
		uniform sampler2D boneSampler;
	#else
		uniform mat4 mBones[BonesPerMesh];
	#endif	

		in vec4 matricesIndices;
		in vec4 matricesWeights;
		#if NUM_BONE_INFLUENCERS > 4
			in vec4 matricesIndicesExtra;
			in vec4 matricesWeightsExtra;
		#endif

	#ifdef BONETEXTURE
		mat4 readMatrixFromRawSampler(sampler2D smp, float index)
		{
			mat4 result;
			float offset = index  * 4.0;	
			float dx = 1.0 / boneTextureWidth;

			result[0] = texture(smp, vec2(dx * (offset + 0.5), 0.));
			result[1] = texture(smp, vec2(dx * (offset + 1.5), 0.));
			result[2] = texture(smp, vec2(dx * (offset + 2.5), 0.));
			result[3] = texture(smp, vec2(dx * (offset + 3.5), 0.));

			return result;
		}
	#endif
#endif