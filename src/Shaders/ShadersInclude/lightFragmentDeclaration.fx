#ifdef LIGHT{X}
	uniform vec4 vLightData{X};
	uniform vec4 vLightDiffuse{X};
	#ifdef SPECULARTERM
		uniform vec3 vLightSpecular{X};
	#else
		vec3 vLightSpecular{X} = vec3(0.);
	#endif
	#ifdef SHADOW{X}
		#if defined(SHADOWCUBE{X})
			#if defined(SHADOWPCF{X})
				uniform highp samplerCubeShadow shadowSampler{X};
			#else
				uniform samplerCube shadowSampler{X};
			#endif
		#else
			varying vec4 vPositionFromLight{X};
			varying float vDepthMetric{X};

			#if defined(SHADOWPCF{X})
				uniform highp sampler2DShadow shadowSampler{X};
			#else
				uniform sampler2D shadowSampler{X};
			#endif
			uniform mat4 lightMatrix{X};
		#endif
		uniform vec4 shadowsInfo{X};
		uniform vec2 depthValues{X};
	#endif
	#ifdef SPOTLIGHT{X}
		uniform vec4 vLightDirection{X};
	#endif
	#ifdef HEMILIGHT{X}
		uniform vec3 vLightGround{X};
	#endif
	#ifdef PROJECTEDLIGHTTEXTURE{X}
		uniform mat4 textureProjectionMatrix{X};
		uniform sampler2D projectionLightSampler{X};
	#endif
#endif