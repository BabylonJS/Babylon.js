#ifdef LIGHT{X}
	uniform vLightData: vec4f{X};
	uniform vLightDiffuse: vec4f{X};

	#ifdef SPECULARTERM
		uniform vLightSpecular: vec4f{X};
	#else
		var vLightSpecular: vec4f{X} =  vec4f(0.);
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
                uniform highp sampler2DArrayShadow shadowTexture{X};
                uniform highp sampler2DArray depthTexture{X};
                uniform lightSizeUVCorrection: vec2f{X}[SHADOWCSMNUM_CASCADES{X}];
                uniform depthCorrection: f32{X}[SHADOWCSMNUM_CASCADES{X}];
                uniform penumbraDarkness: f32{X};
            #elif defined(SHADOWPCF{X})
                uniform highp sampler2DArrayShadow shadowTexture{X};
            #else
                uniform highp sampler2DArray shadowTexture{X};
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
			uniform samplerCube shadowTexture{X};
		#else
			varying vPositionFromLight: vec4f{X};
			varying vDepthMetric: f32{X};

			#if defined(SHADOWPCSS{X})
				uniform highp sampler2DShadow shadowTexture{X};
				uniform highp sampler2D depthTexture{X};
			#elif defined(SHADOWPCF{X})
				uniform highp sampler2DShadow shadowTexture{X};
			#else
				uniform sampler2D shadowTexture{X};
			#endif
			uniform lightMatrix: mat4x4f{X};
		#endif
		uniform shadowsInfo: vec4f{X};
		uniform depthValues: vec2f{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vLightDirection: vec4f{X};
		uniform vLightFalloff: vec4f{X};
	#elif defined(POINTLIGHT{X})
		uniform vLightFalloff: vec4f{X};
	#elif defined(HEMILIGHT{X})
		uniform vLightGround: vec3f{X};
	#endif
	#ifdef PROJECTEDLIGHTTEXTURE{X}
		uniform textureProjectionMatrix: mat4x4f{X};
		uniform sampler2D projectionLightTexture{X};
	#endif
#endif