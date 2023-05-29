#ifdef EXPOSURE
	uniform float exposureLinear;
#endif

#ifdef CONTRAST
	uniform float contrast;
#endif

#if defined(VIGNETTE) || defined(DITHER)
	uniform vec2 vInverseScreenSize;
#endif

#ifdef VIGNETTE
	uniform vec4 vignetteSettings1;
	uniform vec4 vignetteSettings2;
#endif

#ifdef COLORCURVES
	uniform vec4 vCameraColorCurveNegative;
	uniform vec4 vCameraColorCurveNeutral;
	uniform vec4 vCameraColorCurvePositive;
#endif

#ifdef COLORGRADING
	#ifdef COLORGRADING3D
		uniform highp sampler3D txColorTransform;
	#else
		uniform sampler2D txColorTransform;
	#endif
	uniform vec4 colorTransformSettings;
#endif

#ifdef DITHER
	uniform float ditherIntensity;
#endif