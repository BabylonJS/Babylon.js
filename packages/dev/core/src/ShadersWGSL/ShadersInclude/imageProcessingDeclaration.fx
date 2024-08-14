#ifdef EXPOSURE
	uniform exposureLinear: f32;
#endif

#ifdef CONTRAST
	uniform contrast: f32;
#endif

#if defined(VIGNETTE) || defined(DITHER)
	uniform vInverseScreenSize: vec2f;
#endif

#ifdef VIGNETTE
	uniform vignetteSettings1: vec4f;
	uniform vignetteSettings2: vec4f;
#endif

#ifdef COLORCURVES
	uniform vCameraColorCurveNegative: vec4f;
	uniform vCameraColorCurveNeutral: vec4f;
	uniform vCameraColorCurvePositive: vec4f;
#endif

#ifdef COLORGRADING
	#ifdef COLORGRADING3D
		var txColorTransformSampler: sampler;
		var txColorTransform: texture_3d<f32>;
	#else
		var txColorTransformSampler: sampler;
		var txColorTransform: texture_2d<f32>;
	#endif
	uniform colorTransformSettings: vec4f;
#endif

#ifdef DITHER
	uniform ditherIntensity: f32;
#endif