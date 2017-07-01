#ifdef COLORGRADING
/** 
 * Polyfill for SAMPLE_TEXTURE_3D, which is unsupported in WebGL.
 * sampler3dSetting.x = textureOffset (0.5 / textureSize).
 * sampler3dSetting.y = textureSize.
 */
vec3 sampleTexture3D(sampler2D colorTransform, vec3 color, vec2 sampler3dSetting)
{
	float sliceSize = 2.0 * sampler3dSetting.x; // Size of 1 slice relative to the texture, for example 1/8

	float sliceContinuous = (color.y - sampler3dSetting.x) * sampler3dSetting.y;
	float sliceInteger = floor(sliceContinuous);

	// Note: this is mathematically equivalent to fract(sliceContinuous); but we use explicit subtract
	// rather than separate fract() for correct results near slice boundaries (matching sliceInteger choice)
	float sliceFraction = sliceContinuous - sliceInteger;

	vec2 sliceUV = color.xz;
	
	sliceUV.x *= sliceSize;
	sliceUV.x += sliceInteger * sliceSize;

	vec4 slice0Color = texture2D(colorTransform, sliceUV);

	sliceUV.x += sliceSize;
	vec4 slice1Color = texture2D(colorTransform, sliceUV);

	vec3 result = mix(slice0Color.rgb, slice1Color.rgb, sliceFraction);
	color.rgb = result.bgr;

	return color;
}
#endif

vec4 applyImageProcessing(vec4 result) {

#ifdef TONEMAPPING
	result.rgb *= cameraExposureLinear;
#endif

#ifdef VIGNETTE
		//vignette
		vec2 viewportXY = gl_FragCoord.xy * vInverseScreenSize;
		viewportXY = viewportXY * 2.0 - 1.0
		vec3 vignetteXY1 = vec3(viewportXY * vignetteSettings1.xy + vignetteSettings1.zw, 1.0);
		float vignetteTerm = dot(vignetteXY1, vignetteXY1);
		float vignette = pow(vignetteTerm, vignetteSettings2.w);

		// Interpolate between the artist 'color' and white based on the physical transmission value 'vignette'.
		vec3 vignetteColor = vignetteSettings2.rgb;

	#ifdef VIGNETTEBLENDMODEMULTIPLY
		vec3 vignetteColorMultiplier = mix(vignetteColor, vec3(1, 1, 1), vignette);
		result.rgb *= vignetteColorMultiplier;
	#endif

	#ifdef VIGNETTEBLENDMODEOPAQUE
		result.rgb = mix(vignetteColor, result.rgb, vignette);
	#endif
#endif
	
#ifdef TONEMAPPING
	float tonemappingCalibration = 1.590579;
	result.rgb = 1.0 - exp2(-tonemappingCalibration * result.rgb);
#endif

	// Going back to gamma space
	result.rgb = toGammaSpace(result.rgb);
	result.rgb = clamp(result.rgb, 0.0, 1.0);

#ifdef CONTRAST
	// Contrast
	vec3 resultHighContrast = applyEaseInOut(result.rgb);

	if (contrast < 1.0) {
		// Decrease contrast: interpolate towards zero-contrast image (flat grey)
		result.rgb = mix(vec3(0.5, 0.5, 0.5), result.rgb, contrast);
	} else {
		// Increase contrast: apply simple shoulder-toe high contrast curve
		result.rgb = mix(result.rgb, resultHighContrast, contrast - 1.0);
	}
#endif

	// Apply Color Transform
#ifdef COLORGRADING
	vec3 colorTransformInput = result.rgb * colorTransformSettings.xxx + colorTransformSettings.yyy;
	vec3 colorTransformOutput = sampleTexture3D(txColorTransform, colorTransformInput, colorTransformSettings.yz).rgb;

	result.rgb = mix(result.rgb, colorTransformOutput, colorTransformSettings.www);
#endif

#ifdef COLORCURVES
	// Apply Color Curves
	float luma = getLuminance(result.rgb);
	vec2 curveMix = clamp(vec2(luma * 3.0 - 1.5, luma * -3.0 + 1.5), vec2(0.0), vec2(1.0));
	vec4 colorCurve = vCameraColorCurveNeutral + curveMix.x * vCameraColorCurvePositive - curveMix.y * vCameraColorCurveNegative;

	result.rgb *= colorCurve.rgb;
	result.rgb = mix(vec3(luma), result.rgb, colorCurve.a);
#endif

	return result;
}