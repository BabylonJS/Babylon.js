#ifdef _DEFINENAME_
	#if _DEFINENAME_DIRECTUV == 1
		#define v_VARYINGNAME_UV vMainUV1
	#elif _DEFINENAME_DIRECTUV == 2
		#define v_VARYINGNAME_UV vMainUV2
	#elif _DEFINENAME_DIRECTUV == 3
		#define v_VARYINGNAME_UV vMainUV3
	#elif _DEFINENAME_DIRECTUV == 4
		#define v_VARYINGNAME_UV vMainUV4
	#elif _DEFINENAME_DIRECTUV == 5
		#define v_VARYINGNAME_UV vMainUV5
	#elif _DEFINENAME_DIRECTUV == 6
		#define v_VARYINGNAME_UV vMainUV6
	#else
		varying vec2 v_VARYINGNAME_UV;
	#endif
#endif
