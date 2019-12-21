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
	#if defined(SHADOWCUBE{X})
		uniform samplerCube shadowSampler{X};		
    #elif defined(SHADOWCSM{X})
		varying vec4 vPositionFromLight{X}[SHADOWCSM{X}_NUMCASCADES];
		varying float vDepthMetric{X}[SHADOWCSM{X}_NUMCASCADES];
		varying float vDepthInViewSpace{X};

		#if defined(SHADOWPCF{X})
			uniform highp sampler2DShadow shadowSampler{X}_0;
			#if SHADOWCSM{X}_NUMCASCADES >= 2
				uniform highp sampler2DShadow shadowSampler{X}_1;
			#endif
			#if SHADOWCSM{X}_NUMCASCADES >= 3
				uniform highp sampler2DShadow shadowSampler{X}_2;
			#endif
			#if SHADOWCSM{X}_NUMCASCADES >= 4
				uniform highp sampler2DShadow shadowSampler{X}_3;
			#endif
			#if SHADOWCSM{X}_NUMCASCADES >= 5
				uniform highp sampler2DShadow shadowSampler{X}_4;
			#endif
			#if SHADOWCSM{X}_NUMCASCADES >= 6
				uniform highp sampler2DShadow shadowSampler{X}_5;
			#endif
			#if SHADOWCSM{X}_NUMCASCADES >= 7
				uniform highp sampler2DShadow shadowSampler{X}_6;
			#endif
			#if SHADOWCSM{X}_NUMCASCADES >= 8
				uniform highp sampler2DShadow shadowSampler{X}_7;
			#endif
		#else
			uniform highp sampler2D shadowSampler{X}[SHADOWCSM{X}_NUMCASCADES];
		#endif
		uniform mat4 lightMatrix{X}[SHADOWCSM{X}_NUMCASCADES];
		uniform float cascadeSplits{X}[SHADOWCSM{X}_NUMCASCADES];
		uniform lowp int numCascades{X};
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