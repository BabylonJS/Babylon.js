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


#ifdef PROJECTEDLIGHTTEXTURE{X}
	uniform textureProjectionMatrix{X}: mat4x4f;
	var projectionLightSampler{X}: sampler;
#endif
#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform lightMatrix{X}:  array<mat4x4f, SHADOWCSMNUM_CASCADES{X}>;
		uniform viewFrustumZ{X}:  array<f32, SHADOWCSMNUM_CASCADES{X}>;
        uniform frustumLengths{X}:  array<f32, SHADOWCSMNUM_CASCADES{X}>;
        uniform cascadeBlendFactor{X}: f32;

		varying vPositionFromLight{X}: array<vec4f, SHADOWCSMNUM_CASCADES{X}>;
		varying vDepthMetric{X}:  array<f32, SHADOWCSMNUM_CASCADES{X}>;
		varying vPositionFromCamera{X}: vec4f;

		#if defined(SHADOWPCSS{X})
			var shadow{X}Sampler: sampler_comparison;			
			var shadow{X}Texture: texture_depth_2d_array;
			var depth{X}Sampler: sampler;
			var depth{X}Texture: texture_2d_array<f32>
            uniform lightSizeUVCorrection{X}: array<vec2f, SHADOWCSMNUM_CASCADES{X}>;
            uniform depthCorrection{X}: array<f32, SHADOWCSMNUM_CASCADES{X}>;
            uniform penumbraDarkness{X}: f32;
		#elif defined(SHADOWPCF{X})
			var highp sampler2DArrayShadow shadow{X}Sampler;
		#else
			var highp sampler2DArray shadow{X}Sampler;
		#endif

        #ifdef SHADOWCSMDEBUG{X}
            const vCascadeColorsMultiplier{X}: vec3f[8] = vec3f[8]
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
            var shadowDebug{X}: vec3f;
        #endif

        #ifdef SHADOWCSMUSESHADOWMAXZ{X}
            var index{X}: i32 = -1;
        #else
            var index{X}: i32 = SHADOWCSMNUM_CASCADES{X} - 1;
        #endif

        var diff{X}: f32 = 0.;
	#elif defined(SHADOWCUBE{X})
		var shadow{X}Sampler: sampler;		
	#else
		varying vPositionFromLight{X}: vec4f;
		varying vDepthMetric{X}: f32;

		#if defined(SHADOWPCSS{X})
			var shadow{X}Sampler: sampler_comparison;			
			var shadow{X}Texture: texture_depth_2d;
			var depth{X}Sampler: sampler;			
			var depth{X}Texture: texture_2d<f32>;
		#elif defined(SHADOWPCF{X})
			var shadow{X}Sampler: sampler_comparison;
			var shadow{X}Texture: texture_depth_2d;
		#else
			var shadow{X}Sampler: sampler;			
			var shadow{X}Texture: texture_2d<f32>;
		#endif
		uniform lightMatrix{X}: mat4x4f;
	#endif
#endif

#endif