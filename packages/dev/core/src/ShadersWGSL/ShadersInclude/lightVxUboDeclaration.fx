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
		shadowsInfo: vec4f,
		depthValues: vec2f
	} ;

var<uniform> light{X} : Light{X};

#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform lightMatrix{X}: array<mat4x4f, SHADOWCSMNUM_CASCADES{X}>;

		varying vPositionFromLight{X}: array<vec4f, SHADOWCSMNUM_CASCADES{X}>;
		varying vDepthMetric{X}: array<f32, SHADOWCSMNUM_CASCADES{X}>;
		varying vPositionFromCamera{X}: vec4f;
	#elif defined(SHADOWCUBE{X})
	#else
		varying vPositionFromLight{X}: vec4f;
		varying vDepthMetric{X}: f32;

		uniform lightMatrix{X}: mat4x4f;
	#endif
#endif

#endif