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
	uniform projectionLightSampler{X}: sampler;
#endif
#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform lightMatrix: mat4x4f{X}[SHADOWCSMNUM_CASCADES{X}];
		uniform viewFrustumZ: f32{X}[SHADOWCSMNUM_CASCADES{X}];
        uniform frustumLengths: f32{X}[SHADOWCSMNUM_CASCADES{X}];
        uniform cascadeBlendFactor: f32{X};

		varying vPositionFromLight: vec4f{X}[SHADOWCSMNUM_CASCADES{X}];
		varying vDepthMetric: f32{X}[SHADOWCSMNUM_CASCADES{X}];
		varying vPositionFromCamera: vec4f{X};

		#if defined(SHADOWPCSS{X})
			uniform highp sampler2DArrayShadow shadowSampler{X};
			uniform highp sampler2DArray depthSampler{X};
            uniform lightSizeUVCorrection: vec2f{X}[SHADOWCSMNUM_CASCADES{X}];
            uniform depthCorrection: f32{X}[SHADOWCSMNUM_CASCADES{X}];
            uniform penumbraDarkness: f32{X};
		#elif defined(SHADOWPCF{X})
			uniform highp sampler2DArrayShadow shadowSampler{X};
		#else
			uniform highp sampler2DArray shadowSampler{X};
		#endif

        #ifdef SHADOWCSMDEBUG{X}
            const vCascadeColorsMultiplier: vec3f{X}[8] = vec3[8]
            (
                vec3 ( 1.5, 0.0, 0.0 ),
                vec3 ( 0.0, 1.5, 0.0 ),
                vec3 ( 0.0, 0.0, 5.5 ),
                vec3 ( 1.5, 0.0, 5.5 ),
                vec3 ( 1.5, 1.5, 0.0 ),
                vec3 ( 1.0, 1.0, 1.0 ),
                vec3 ( 0.0, 1.0, 5.5 ),
                vec3 ( 0.5, 3.5, 0.75 )
            );
            var shadowDebug: vec3f{X};
        #endif

        #ifdef SHADOWCSMUSESHADOWMAXZ{X}
            var index: i32{X} = -1;
        #else
            var index: i32{X} = SHADOWCSMNUM_CASCADES{X} - 1;
        #endif

        var diff: f32{X} = 0.;
	#elif defined(SHADOWCUBE{X})
		uniform shadowSampler{X}: sampler;		
	#else
		varying vPositionFromLight: vec4f{X};
		varying vDepthMetric: f32{X};

		#if defined(SHADOWPCSS{X})
			uniform shadowSampler{X}: sampler;
			uniform depthSampler{X}: sampler;
		#elif defined(SHADOWPCF{X})
			uniform shadowSampler{X}: sampler;
		#else
			uniform shadowSampler{X}: sampler;
		#endif
		uniform lightMatrix: mat4x4f{X};
	#endif
#endif

#endif