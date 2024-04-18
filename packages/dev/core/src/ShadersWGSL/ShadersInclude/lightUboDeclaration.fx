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
	// #ifdef SHADOWCSM{X}
	// 	uniform lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}]: mat4x4f;
	// 	uniform viewFrustumZ{X}[SHADOWCSMNUM_CASCADES{X}]: f32;
    //     uniform frustumLengths{X}[SHADOWCSMNUM_CASCADES{X}]: f32;
    //     uniform cascadeBlendFactor{X}: f32;

	// 	varying vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}]: vec4f;
	// 	varying vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}]: f32f;
	// 	varying vPositionFromCamera{X}: vec4f;

	// 	#if defined(SHADOWPCSS{X})
	// 		uniform highp sampler2DArrayShadow shadowSampler{X};
	// 		uniform highp sampler2DArray depthSampler{X};
    //         uniform vec2 lightSizeUVCorrection{X}[SHADOWCSMNUM_CASCADES{X}];
    //         uniform float depthCorrection{X}[SHADOWCSMNUM_CASCADES{X}];
    //         uniform float penumbraDarkness{X};
	// 	#elif defined(SHADOWPCF{X})
	// 		uniform highp sampler2DArrayShadow shadowSampler{X};
	// 	#else
	// 		uniform highp sampler2DArray shadowSampler{X};
	// 	#endif

    //     #ifdef SHADOWCSMDEBUG{X}
    //         const vec3 vCascadeColorsMultiplier{X}[8] = vec3[8]
    //         (
    //             vec3 ( 1.5, 0.0, 0.0 ),
    //             vec3 ( 0.0, 1.5, 0.0 ),
    //             vec3 ( 0.0, 0.0, 5.5 ),
    //             vec3 ( 1.5, 0.0, 5.5 ),
    //             vec3 ( 1.5, 1.5, 0.0 ),
    //             vec3 ( 1.0, 1.0, 1.0 ),
    //             vec3 ( 0.0, 1.0, 5.5 ),
    //             vec3 ( 0.5, 3.5, 0.75 )
    //         );
    //         vec3 shadowDebug{X};
    //     #endif

    //     #ifdef SHADOWCSMUSESHADOWMAXZ{X}
    //         int index{X} = -1;
    //     #else
    //         int index{X} = SHADOWCSMNUM_CASCADES{X} - 1;
    //     #endif

    //     float diff{X} = 0.;
	// #elif defined(SHADOWCUBE{X})
	// 	uniform samplerCube shadowSampler{X};		
	// #else
	// 	varying vec4 vPositionFromLight{X};
	// 	varying float vDepthMetric{X};

	// 	#if defined(SHADOWPCSS{X})
	// 			uniform highp sampler2DShadow shadowSampler{X};
	// 			uniform highp sampler2D depthSampler{X};
	// 	#elif defined(SHADOWPCF{X})
	// 		uniform highp sampler2DShadow shadowSampler{X};
	// 	#else
	// 		uniform sampler2D shadowSampler{X};
	// 	#endif
	// 	uniform mat4 lightMatrix{X};
	// #endif
#endif

#endif