#ifdef LIGHT{X}
	struct Light{X}
	{
		vLightData: vec4f,
		vLightDiffuse: vec4f,
		vLightSpecular: vec4f,
		#ifdef SPOTLIGHT{X}
			vLightDirection: vec4f,
			vLightFalloff: vec4f,
		#elif defined(POINTLIGHT{X})
			vLightFalloff: vec4f,
		#elif defined(HEMILIGHT{X})
			vLightGround: vec3f,
		#endif
		#if defined(AREALIGHT{X})
			vLightWidth: vec4f,
			vLightHeight: vec4f,
		#endif
		shadowsInfo: vec4f,
		depthValues: vec2f
	} ;

var<uniform> light{X} : Light{X};

#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform lightMatrix{X}: array<mat4x4f, SHADOWCSMNUM_CASCADES{X}>;

		// Because WGSL does not allow us to have arrays as varying...
		varying vPositionFromLight{X}_0: vec4f;
		varying vDepthMetric{X}_0:  f32;
		varying vPositionFromLight{X}_1: vec4f;
		varying vDepthMetric{X}_1:  f32;
		varying vPositionFromLight{X}_2: vec4f;
		varying vDepthMetric{X}_2:  f32;
		varying vPositionFromLight{X}_3: vec4f;
		varying vDepthMetric{X}_3:  f32;
		varying vPositionFromCamera{X}: vec4f;
	#elif defined(SHADOWCUBE{X})
	#else
		varying vPositionFromLight{X}: vec4f;
		varying vDepthMetric{X}: f32;

		uniform lightMatrix{X}: mat4x4f;
	#endif
#endif

#endif