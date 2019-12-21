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