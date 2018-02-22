#ifdef LIGHT{X}
	uniform Light{X}
	{
		vec4 vLightData;
		vec4 vLightDiffuse;
		vec3 vLightSpecular;
		#ifdef SPOTLIGHT{X}
			vec4 vLightDirection;
		#endif
		#ifdef HEMILIGHT{X}
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
	#if defined(SHADOWCUBE{X})
		#if defined(USEDEPTHSTENCILTEXTURE{X})
			uniform highp samplerCubeShadow shadowSampler{X};
		#else
			uniform samplerCube shadowSampler{X};
		#endif
	#else
		varying vec4 vPositionFromLight{X};
		varying float vDepthMetric{X};

		#if defined(USEDEPTHSTENCILTEXTURE{X})
			uniform highp sampler2DShadow shadowSampler{X};
		#else
			uniform sampler2D shadowSampler{X};
		#endif
		uniform mat4 lightMatrix{X};
	#endif
#endif

#endif