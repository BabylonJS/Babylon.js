#define CSMMAXCASCADES 8

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
		varying vec4 vPositionFromLight{X}[CSMMAXCASCADES];
		varying float vDepthMetric{X}[CSMMAXCASCADES];
		varying float vDepthInViewSpace{X};

		#if defined(SHADOWPCF{X})
            uniform highp sampler2DShadow shadowSampler{X}_0;
            uniform highp sampler2DShadow shadowSampler{X}_1;
            uniform highp sampler2DShadow shadowSampler{X}_2;
            uniform highp sampler2DShadow shadowSampler{X}_3;
		#else
			uniform highp sampler2D shadowSampler{X}[CSMMAXCASCADES];
		#endif
		uniform mat4 lightMatrix{X}[CSMMAXCASCADES];
		uniform float cascadeSplits{X}[CSMMAXCASCADES];
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