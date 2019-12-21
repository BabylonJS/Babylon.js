#ifdef LIGHT{X}
	uniform Light{X}
	{
		vec4 vLightData;

		vec4 vLightDiffuse;
		vec3 vLightSpecular;
		#ifdef SPOTLIGHT{X}
			vec4 vLightDirection;
			vec4 vLightFalloff;
		#elif defined(POINTLIGHT{X})
			vec4 vLightFalloff;
		#elif defined(HEMILIGHT{X})
			vec3 vLightGround;
		#endif
		vec4 shadowsInfo;
		vec2 depthValues;
	} light{X};
#ifdef PROJECTEDLIGHTTEXTURE{X}
	uniform mat4 textureProjectionMatrix{X};
	uniform sampler2D projectionLightSampler{X};
#endif
#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform mat4 lightMatrixCSM{X}[SHADOWCSMNUM_CASCADES{X}];
		uniform mat4 camViewMatCSM{X};
		uniform float viewFrustumZCSM{X}[SHADOWCSMNUM_CASCADES{X}];
		varying vec4 vPositionFromLightCSM{X}[SHADOWCSMNUM_CASCADES{X}];
		varying float vDepthMetricCSM{X}[SHADOWCSMNUM_CASCADES{X}];
		varying vec4 vPositionFromCameraCSM{X};

		#if defined(SHADOWPCSS{X})
			uniform highp sampler2DArrayShadow shadowSampler{X};
			uniform highp sampler2DArray depthSampler{X};
		#else
			uniform highp sampler2DArrayShadow shadowSampler{X};
		#endif

		//uniform sampler2D shadowSamplerArrayCSM{X}[NUM_CASCADESP{X}];
		// varying vec4 vPositionFromLight{X};
		// varying float vDepthMetric{X};
		// uniform mat4 lightMatrix{X};
	#elif defined(SHADOWCUBE{X})
		uniform samplerCube shadowSampler{X};		
	#else
		varying vec4 vPositionFromLight{X};
		varying float vDepthMetric{X};

		#if defined(SHADOWPCSS{X})
				uniform highp sampler2DShadow shadowSampler{X};
				uniform highp sampler2D depthSampler{X};
		#elif defined(SHADOWPCF{X})
			uniform highp sampler2DShadow shadowSampler{X};
		#else
			uniform sampler2D shadowSampler{X};
		#endif
		uniform mat4 lightMatrix{X};
	#endif
#endif

#endif