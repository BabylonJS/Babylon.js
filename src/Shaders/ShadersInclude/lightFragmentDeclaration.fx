#define CSMMAXCASCADES 8

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
			uniform samplerCube shadowSampler{X};
        #elif defined(SHADOWCSM{X})
			varying vec4 vPositionFromLight{X}[CSMMAXCASCADES];
			varying float vDepthMetric{X}[CSMMAXCASCADES];
            varying float vDepthInViewSpace{X};

			#if defined(SHADOWPCF{X})
				uniform highp sampler2DShadow shadowSampler{X}[CSMMAXCASCADES];
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
	#ifdef PROJECTEDLIGHTTEXTURE{X}
		uniform mat4 textureProjectionMatrix{X};
		uniform sampler2D projectionLightSampler{X};
	#endif
#endif