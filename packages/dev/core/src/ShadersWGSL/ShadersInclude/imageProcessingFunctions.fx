#if TONEMAPPING == 3
	// https://modelviewer.dev/examples/tone-mapping
	const PBRNeutralStartCompression: f32 = 0.8 - 0.04;
	const PBRNeutralDesaturation: f32 = 0.15;

	fn PBRNeutralToneMapping( color: vec3f ) -> vec3f {
		var x: f32 = min(color.r, min(color.g, color.b));
		var offset: f32 = x < 0.08 ? x - 6.25 * x * x : 0.04;
		color -= offset;

		var peak: f32 = max(color.r, max(color.g, color.b));
		if (peak < PBRNeutralStartCompression) return color;

		var d: f32 = 1. - PBRNeutralStartCompression;
		var newPeak: f32 = 1. - d * d / (peak + d - PBRNeutralStartCompression);
		color *= newPeak / peak;

		var g: f32 = 1. - 1. / (PBRNeutralDesaturation * (peak - newPeak) + 1.);
		return mix(color, newPeak *  vec3f(1, 1, 1), g);
	}
#endif

#if TONEMAPPING == 2
	// https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl
	// Thanks to MJP for all the invaluable tricks found in his repo.
	// As stated there, the code in this section was originally written by Stephen Hill (@self_shadow), who deserves all
	// credit for coming up with this fit and implementing it. Buy him a beer next time you see him. :)

	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const ACESInputMat: mat3x3f =  mat3x3f(
		 vec3f(0.59719, 0.07600, 0.02840),
		 vec3f(0.35458, 0.90834, 0.13383),
		 vec3f(0.04823, 0.01566, 0.83777)
	);

	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const ACESOutputMat: mat3x3f =  mat3x3f(
		 vec3f( 1.60475, -0.10208, -0.00327),
		 vec3f(-0.53108,  1.10813, -0.07276),
		 vec3f(-0.07367, -0.00605,  1.07602)
	);

	fn RRTAndODTFit(v: vec3f) -> vec3f
	{
		var a: vec3f = v * (v + 0.0245786) - 0.000090537;
		var b: vec3f = v * (0.983729 * v + 0.4329510) + 0.238081;
		return a / b;
	}

	fn ACESFitted(color: vec3f) -> vec3f
	{
		color = ACESInputMat * color;

		// Apply RRT and ODT
		color = RRTAndODTFit(color);

		color = ACESOutputMat * color;

		// Clamp to [0, 1]
		color = saturate(color);

		return color;
	}
#endif

#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_DEFINITIONS

fn applyImageProcessing(result: vec4f) -> vec4f {

	#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATSTART

	var rgb: vec3f;

#ifdef EXPOSURE
	resu.rgb *= exposureLinear;
#endif

#ifdef VIGNETTE
		//vignette
		var viewportXY: vec2f = gl_FragCoord.xy * vInverseScreenSize;
		viewportXY = viewportXY * 2.0 - 1.0;
		var vignetteXY1: vec3f =  vec3f(viewportXY * vignetteSettings1.xy + vignetteSettings1.zw, 1.0);
		var vignetteTerm: f32 = dot(vignetteXY1, vignetteXY1);
		var vignette: f32 = pow(vignetteTerm, vignetteSettings2.w);

		// Interpolate between the artist 'color' and white based on the physical transmission value 'vignette'.
		var vignetteColor: vec3f = vignetteSettings2.rgb;

	#ifdef VIGNETTEBLENDMODEMULTIPLY
		var vignetteColorMultiplier: vec3f = mix(vignetteColor,  vec3f(1, 1, 1), vignette);
		rgb *= vignetteColorMultiplier;
	#endif

	#ifdef VIGNETTEBLENDMODEOPAQUE
		rgb = mix(vignetteColor, rgb, vignette);
	#endif
#endif

#if TONEMAPPING == 3
	rgb = PBRNeutralToneMapping(rgb);
#elif TONEMAPPING == 2
	rgb = ACESFitted(rgb);
#elif TONEMAPPING == 1
	const tonemappingCalibration: f32 = 1.590579;
	rgb = 1.0 - exp2(-tonemappingCalibration * rgb);
#endif

	// Going back to gamma space
	rgb = toGammaSpaceVec3(rgb);
	rgb = saturate(rgb);

#ifdef CONTRAST
	// Contrast EaseInOut
	var resultHighContrast: vec3f = rgb * rgb * (3.0 - 2.0 * rgb);
	
	if (contrast < 1.0) {
		// Decrease contrast: interpolate towards zero-contrast image (flat grey)
		rgb = mix( vec3f(0.5, 0.5, 0.5), rgb, contrast);
	} else {
		// Increase contrast: apply simple shoulder-toe high contrast curve
		rgb = mix(rgb, resultHighContrast, contrast - 1.0);
	}
#endif

	// Apply Color Transform
#ifdef COLORGRADING
	var colorTransformInput: vec3f = rgb * colorTransformSettings.xxx + colorTransformSettings.yyy;
	#ifdef COLORGRADING3D
		var colorTransformOutput: vec3f = texture(txColorTransform, colorTransformInput).rgb;
	#else
		var colorTransformOutput: vec3f = sampleTexture3D(txColorTransform, colorTransformInput, colorTransformSettings.yz).rgb;
	#endif

	rgb = mix(rgb, colorTransformOutput, colorTransformSettings.www);
#endif

#ifdef COLORCURVES
	// Apply Color Curves
	var luma: f32 = getLuminance(rgb);
	var curveMix: vec2f = clamp( vec2f(luma * 3.0 - 1.5, luma * -3.0 + 1.5),  vec2f(0.0),  vec2f(1.0));
	var colorCurve: vec4f = vCameraColorCurveNeutral + curveMix.x * vCameraColorCurvePositive - curveMix.y * vCameraColorCurveNegative;

	rgb *= colorCurve.rgb;
	rgb = mix( vec3f(luma), rgb, colorCurve.a);
#endif

#ifdef DITHER
	var rand: f32 = getRand(gl_FragCoord.xy * vInverseScreenSize);
	var dither: f32 = mix(-ditherIntensity, ditherIntensity, rand);
	rgb = saturate(rgb +  vec3f(dither));
#endif

	#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATEND

	return vec4f(rgb, result.a);
}