#ifdef LIGHT{X}
	uniform vec4 vLightData{X};
	uniform vec4 vLightDiffuse{X};

	#ifdef SPECULARTERM
		uniform vec4 vLightSpecular{X};
	#else
		vec4 vLightSpecular{X} = vec4(0.);
	#endif
	#ifdef SHADOW{X}
        #ifdef SHADOWCSM{X}
            uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];
            uniform float viewFrustumZ{X}[SHADOWCSMNUM_CASCADES{X}];
            uniform float frustumLengths{X}[SHADOWCSMNUM_CASCADES{X}];
            uniform float cascadeBlendFactor{X};

            varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];
            varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];
            varying vec4 vPositionFromCamera{X};

            #if defined(SHADOWPCSS{X})
                uniform highp sampler2DArrayShadow shadowTexture{X};
                uniform highp sampler2DArray depthTexture{X};
                uniform vec2 lightSizeUVCorrection{X}[SHADOWCSMNUM_CASCADES{X}];
                uniform float depthCorrection{X}[SHADOWCSMNUM_CASCADES{X}];
                uniform float penumbraDarkness{X};
            #elif defined(SHADOWPCF{X})
                uniform highp sampler2DArrayShadow shadowTexture{X};
            #else
                uniform highp sampler2DArray shadowTexture{X};
            #endif

            #ifdef SHADOWCSMDEBUG{X}
                const vec3 vCascadeColorsMultiplier{X}[8] = vec3[8]
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
                vec3 shadowDebug{X};
            #endif

            #ifdef SHADOWCSMUSESHADOWMAXZ{X}
                int index{X} = -1;
            #else
                int index{X} = SHADOWCSMNUM_CASCADES{X} - 1;
            #endif

            float diff{X} = 0.;
        #elif defined(SHADOWCUBE{X})
			uniform samplerCube shadowTexture{X};
		#else
			varying vec4 vPositionFromLight{X};
			varying float vDepthMetric{X};

			#if defined(SHADOWPCSS{X})
				uniform highp sampler2DShadow shadowTexture{X};
				uniform highp sampler2D depthTexture{X};
			#elif defined(SHADOWPCF{X})
				uniform highp sampler2DShadow shadowTexture{X};
			#else
				uniform sampler2D shadowTexture{X};
			#endif
			uniform mat4 lightMatrix{X};
		#endif
		uniform vec4 shadowsInfo{X};
		uniform vec2 depthValues{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vec4 vLightDirection{X};
		uniform vec4 vLightFalloff{X};
	#elif defined(POINTLIGHT{X})
		uniform vec4 vLightFalloff{X};
	#elif defined(HEMILIGHT{X})
		uniform vec3 vLightGround{X};
    #endif
    #ifdef AREALIGHT{X}
        uniform vec4 vLightWidth{X};
        uniform vec4 vLightHeight{X};

        #ifdef RECTAREALIGHTEMISSIONTEXTURE{X}
		    uniform sampler2D rectAreaLightEmissionTexture{X};
	    #endif

	#endif
	#ifdef IESLIGHTTEXTURE{X}
		uniform sampler2D iesLightTexture{X};
	#endif
	#ifdef PROJECTEDLIGHTTEXTURE{X}
		uniform mat4 textureProjectionMatrix{X};
		uniform sampler2D projectionLightTexture{X};
	#endif
    #ifdef CLUSTLIGHT{X}
        uniform vec2 vSliceData{X};
        uniform vec2 vSliceRanges{X}[CLUSTLIGHT_SLICES];
        uniform sampler2D lightDataTexture{X};
        // Ensure the mask is sampled with high precision
	    uniform highp sampler2D tileMaskTexture{X};
    #endif
#endif