#if NUM_BONE_INFLUENCERS > 0
	#ifdef BONETEXTURE
		uniform sampler2D boneSampler;
		uniform float boneTextureWidth;
	#else
		uniform mat4 mBones[BonesPerMesh];
		#ifdef BONES_VELOCITY_ENABLED
		    uniform mat4 mPreviousBones[BonesPerMesh];
		#endif
	#endif

	attribute vec4 matricesIndices;
	attribute vec4 matricesWeights;
	#if NUM_BONE_INFLUENCERS > 4
		attribute vec4 matricesIndicesExtra;
		attribute vec4 matricesWeightsExtra;
	#endif

	#ifdef BONETEXTURE
        #define inline
		mat4 readMatrixFromRawSampler(sampler2D smp, float index)
		{
			float offset = index  * 4.0;	
			float dx = 1.0 / boneTextureWidth;

			vec4 m0 = texture2D(smp, vec2(dx * (offset + 0.5), 0.));
			vec4 m1 = texture2D(smp, vec2(dx * (offset + 1.5), 0.));
			vec4 m2 = texture2D(smp, vec2(dx * (offset + 2.5), 0.));
			vec4 m3 = texture2D(smp, vec2(dx * (offset + 3.5), 0.));

			return mat4(m0, m1, m2, m3);
		}
	#endif

#endif