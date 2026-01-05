#if TONEMAPPING == 3
	// https://modelviewer.dev/examples/tone-mapping
	const PBRNeutralStartCompression: f32 = 0.8 - 0.04;
	const PBRNeutralDesaturation: f32 = 0.15;

	fn PBRNeutralToneMapping( color: vec3f ) -> vec3f {
		var x: f32 = min(color.r, min(color.g, color.b));
		var offset: f32 = select(0.04, x - 6.25 * x * x,x < 0.08);
		var result = color;
		result -= offset;

		var peak: f32 = max(result.r, max(result.g, result.b));
		if (peak < PBRNeutralStartCompression) {
			return result;
		}

		var d: f32 = 1. - PBRNeutralStartCompression;
		var newPeak: f32 = 1. - d * d / (peak + d - PBRNeutralStartCompression);
		result *= newPeak / peak;

		var g: f32 = 1. - 1. / (PBRNeutralDesaturation * (peak - newPeak) + 1.);
		return mix(result, newPeak *  vec3f(1, 1, 1), g);
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
		var output = ACESInputMat * color;

		// Apply RRT and ODT
		output = RRTAndODTFit(output);

		output = ACESOutputMat * output;

		// Clamp to [0, 1]
		output = saturateVec3(output);

		return output;
	}
#endif

#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_DEFINITIONS

fn applyImageProcessing(result: vec4f) -> vec4f {

	#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATSTART

	var rgb = result.rgb;;

#ifdef EXPOSURE
	rgb *= uniforms.exposureLinear;
#endif

#ifdef VIGNETTE
		//vignette
		var viewportXY: vec2f = fragmentInputs.position.xy * uniforms.vInverseScreenSize;
		viewportXY = viewportXY * 2.0 - 1.0;
		var vignetteXY1: vec3f =  vec3f(viewportXY * uniforms.vignetteSettings1.xy + uniforms.vignetteSettings1.zw, 1.0);
		var vignetteTerm: f32 = dot(vignetteXY1, vignetteXY1);
		var vignette: f32 = pow(vignetteTerm, uniforms.vignetteSettings2.w);

		// Interpolate between the artist 'color' and white based on the physical transmission value 'vignette'.
		var vignetteColor: vec3f = uniforms.vignetteSettings2.rgb;

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
	rgb = saturateVec3(rgb);

#ifdef CONTRAST
	// Contrast EaseInOut
	var resultHighContrast: vec3f = rgb * rgb * (3.0 - 2.0 * rgb);
	
	if (uniforms.contrast < 1.0) {
		// Decrease contrast: interpolate towards zero-contrast image (flat grey)
		rgb = mix( vec3f(0.5, 0.5, 0.5), rgb, uniforms.contrast);
	} else {
		// Increase contrast: apply simple shoulder-toe high contrast curve
		rgb = mix(rgb, resultHighContrast, uniforms.contrast - 1.0);
	}
	rgb = max(rgb, vec3f(0.));
#endif

	// Apply Color Transform
#ifdef COLORGRADING
	var colorTransformInput: vec3f = rgb * uniforms.colorTransformSettings.xxx + uniforms.colorTransformSettings.yyy;
	#ifdef COLORGRADING3D
		var colorTransformOutput: vec3f = textureSample(txColorTransform, txColorTransformSampler, colorTransformInput).rgb;
	#else
		var colorTransformOutput: vec3f = textureSample(txColorTransform, txColorTransformSampler, colorTransformInput, uniforms.colorTransformSettings.yz).rgb;
	#endif

	rgb = mix(rgb, colorTransformOutput, uniforms.colorTransformSettings.www);
#endif

#ifdef COLORCURVES
	// Apply Color Curves
	var luma: f32 = getLuminance(rgb);
	var curveMix: vec2f = clamp( vec2f(luma * 3.0 - 1.5, luma * -3.0 + 1.5),  vec2f(0.0),  vec2f(1.0));
	var colorCurve: vec4f = uniforms.vCameraColorCurveNeutral + curveMix.x * uniforms.vCameraColorCurvePositive - curveMix.y * uniforms.vCameraColorCurveNegative;

	rgb *= colorCurve.rgb;
	rgb = mix( vec3f(luma), rgb, colorCurve.a);
#endif

#ifdef DITHER
	var rand: f32 = getRand(fragmentInputs.position.xy * uniforms.vInverseScreenSize);
	var dither: f32 = mix(-uniforms.ditherIntensity, uniforms.ditherIntensity, rand);
	rgb = saturateVec3(rgb +  vec3f(dither));
#endif

	#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATEND

	return vec4f(rgb, result.a);
}