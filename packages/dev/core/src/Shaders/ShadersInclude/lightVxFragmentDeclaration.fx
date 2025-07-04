uniform float vLightType{X};
uniform vec4 vLightPosition{X};
uniform vec4 vLightDiffuse{X};
uniform vec4 vLightSpecular{X};
uniform vec4 vLightDataA{X};
uniform vec4 vLightDataB{X};
uniform vec4 shadowsInfo{X};
uniform vec2 depthValues{X};

#ifdef SHADOW{X}
	#ifdef SHADOWCSM{X}
		uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];

		varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];
		varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];
		varying vec4 vPositionFromCamera{X};
	#elif defined(SHADOWCUBE{X})
	#else
		varying vec4 vPositionFromLight{X};
		varying float vDepthMetric{X};

		uniform mat4 lightMatrix{X};
	#endif
#endif