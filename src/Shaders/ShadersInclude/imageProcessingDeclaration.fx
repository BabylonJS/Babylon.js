#ifdef EXPOSURE
	uniform float exposureLinear;
#endif

#ifdef CONTRAST
	uniform float contrast;
#endif

#ifdef VIGNETTE
	uniform vec2 vInverseScreenSize;
	uniform vec4 vignetteSettings1;
	uniform vec4 vignetteSettings2;
#endif

#ifdef COLORCURVES
	uniform vec4 vCameraColorCurveNegative;
	uniform vec4 vCameraColorCurveNeutral;
	uniform vec4 vCameraColorCurvePositive;
#endif

#ifdef COLORGRADING
	uniform sampler2D txColorTransform;
	uniform vec4 colorTransformSettings;
#endif