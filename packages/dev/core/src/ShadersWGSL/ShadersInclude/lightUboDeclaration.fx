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
		#elif defined(CLUSTLIGHT{X})
			vSliceData: vec2f,
			vSliceRanges: array<vec4f, CLUSTLIGHT_SLICES>,
		#endif
		#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
			vLightWidth: vec4f,
			vLightHeight: vec4f,
		#endif
		shadowsInfo: vec4f,
		depthValues: vec2f
	} ;

var<uniform> light{X} : Light{X};

#ifdef IESLIGHTTEXTURE{X}
	var iesLightTexture{X}Sampler: sampler;
	var iesLightTexture{X}: texture_2d<f32>;
#endif

#ifdef RECTAREALIGHTEMISSIONTEXTURE{X}
	var rectAreaLightEmissionTexture{X}Sampler: sampler;
	var rectAreaLightEmissionTexture{X}: texture_2d<f32>;
#endif

#ifdef PROJECTEDLIGHTTEXTURE{X}
	uniform textureProjectionMatrix{X}: mat4x4f;
	var projectionLightTexture{X}Sampler: sampler;
	var projectionLightTexture{X}: texture_2d<f32>;
#endif

#ifdef CLUSTLIGHT{X}
	var lightDataTexture{X}: texture_2d<f32>;
	var<storage, read> tileMaskBuffer{X}: array<u32>;
#endif

#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform lightMatrix{X}:  array<mat4x4f, SHADOWCSMNUM_CASCADES{X}>;
		uniform viewFrustumZ{X}:  array<f32, SHADOWCSMNUM_CASCADES{X}>;
        uniform frustumLengths{X}:  array<f32, SHADOWCSMNUM_CASCADES{X}>;
        uniform cascadeBlendFactor{X}: f32;

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

		var<private> vPositionFromLight{X}: array<vec4f, 4>;
		var<private> vDepthMetric{X} : array<f32, 4>;

		#if defined(SHADOWPCSS{X})
			var shadowTexture{X}Sampler: sampler_comparison;			
			var shadowTexture{X}: texture_depth_2d_array;
			var depthTexture{X}Sampler: sampler;
			var depthTexture{X}: texture_2d_array<f32>;
            uniform lightSizeUVCorrection{X}: array<vec2f, SHADOWCSMNUM_CASCADES{X}>;
            uniform depthCorrection{X}: array<f32, SHADOWCSMNUM_CASCADES{X}>;
            uniform penumbraDarkness{X}: f32;
		#elif defined(SHADOWPCF{X})
			var shadowTexture{X}Sampler: sampler_comparison;
			var shadowTexture{X}: texture_depth_2d_array;
		#else			
			var shadowTexture{X}Sampler: sampler;			
			var shadowTexture{X}: texture_2d_array<f32>;
		#endif

        #ifdef SHADOWCSMDEBUG{X}
            const vCascadeColorsMultiplier{X}: array<vec3f, 8> = array<vec3f, 8>
            (
                vec3f ( 1.5, 0.0, 0.0 ),
                vec3f ( 0.0, 1.5, 0.0 ),
                vec3f ( 0.0, 0.0, 5.5 ),
                vec3f ( 1.5, 0.0, 5.5 ),
                vec3f ( 1.5, 1.5, 0.0 ),
                vec3f ( 1.0, 1.0, 1.0 ),
                vec3f ( 0.0, 1.0, 5.5 ),
                vec3f ( 0.5, 3.5, 0.75 )
            );
        #endif
	#elif defined(SHADOWCUBE{X})
		var shadowTexture{X}Sampler: sampler;
		var shadowTexture{X}: texture_cube<f32>;
	#else
		varying vPositionFromLight{X}: vec4f;
		varying vDepthMetric{X}: f32;

		#if defined(SHADOWPCSS{X})
			var shadowTexture{X}Sampler: sampler_comparison;			
			var shadowTexture{X}: texture_depth_2d;
			var depthTexture{X}Sampler: sampler;			
			var depthTexture{X}: texture_2d<f32>;
		#elif defined(SHADOWPCF{X})
			var shadowTexture{X}Sampler: sampler_comparison;
			var shadowTexture{X}: texture_depth_2d;
		#else
			var shadowTexture{X}Sampler: sampler;			
			var shadowTexture{X}: texture_2d<f32>;
		#endif
		uniform lightMatrix{X}: mat4x4f;
	#endif
#endif

#endif