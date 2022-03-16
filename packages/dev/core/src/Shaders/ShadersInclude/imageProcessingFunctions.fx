#if defined(COLORGRADING) && !defined(COLORGRADING3D)
	/** 
	* Polyfill for SAMPLE_TEXTURE_3D, which is unsupported in WebGL.
	* sampler3dSetting.x = textureOffset (0.5 / textureSize).
	* sampler3dSetting.y = textureSize.
	*/
    #define inline
	vec3 sampleTexture3D(sampler2D colorTransform, vec3 color, vec2 sampler3dSetting)
	{
		float sliceSize = 2.0 * sampler3dSetting.x; // Size of 1 slice relative to the texture, for example 1/8

	#ifdef SAMPLER3DGREENDEPTH
		float sliceContinuous = (color.g - sampler3dSetting.x) * sampler3dSetting.y;
	#else
		float sliceContinuous = (color.b - sampler3dSetting.x) * sampler3dSetting.y;
	#endif
		float sliceInteger = floor(sliceContinuous);

		// Note: this is mathematically equivalent to fract(sliceContinuous); but we use explicit subtract
		// rather than separate fract() for correct results near slice boundaries (matching sliceInteger choice)
		float sliceFraction = sliceContinuous - sliceInteger;

	#ifdef SAMPLER3DGREENDEPTH
		vec2 sliceUV = color.rb;
	#else
		vec2 sliceUV = color.rg;
	#endif
		
		sliceUV.x *= sliceSize;
		sliceUV.x += sliceInteger * sliceSize;

		sliceUV = saturate(sliceUV);

		vec4 slice0Color = texture2D(colorTransform, sliceUV);

		sliceUV.x += sliceSize;
		
		sliceUV = saturate(sliceUV);
		vec4 slice1Color = texture2D(colorTransform, sliceUV);

		vec3 result = mix(slice0Color.rgb, slice1Color.rgb, sliceFraction);

	#ifdef SAMPLER3DBGRMAP
		color.rgb = result.rgb;
	#else
		color.rgb = result.bgr;
	#endif

		return color;
	}
#endif

#ifdef TONEMAPPING_ACES
	// https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl
	// Thanks to MJP for all the invaluable tricks found in his repo.
	// As stated there, the code in this section was originally written by Stephen Hill (@self_shadow), who deserves all
	// credit for coming up with this fit and implementing it. Buy him a beer next time you see him. :)

	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const mat3 ACESInputMat = mat3(
		vec3(0.59719, 0.07600, 0.02840),
		vec3(0.35458, 0.90834, 0.13383),
		vec3(0.04823, 0.01566, 0.83777)
	);

	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const mat3 ACESOutputMat = mat3(
		vec3( 1.60475, -0.10208, -0.00327),
		vec3(-0.53108,  1.10813, -0.07276),
		vec3(-0.07367, -0.00605,  1.07602)
	);

	vec3 RRTAndODTFit(vec3 v)
	{
		vec3 a = v * (v + 0.0245786) - 0.000090537;
		vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
		return a / b;
	}

	vec3 ACESFitted(vec3 color)
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

vec4 applyImageProcessing(vec4 result) {

#ifdef EXPOSURE
	result.rgb *= exposureLinear;
#endif

#ifdef VIGNETTE
		//vignette
		vec2 viewportXY = gl_FragCoord.xy * vInverseScreenSize;
		viewportXY = viewportXY * 2.0 - 1.0;
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
	#ifdef TONEMAPPING_ACES
		result.rgb = ACESFitted(result.rgb);
	#else
		const float tonemappingCalibration = 1.590579;
		result.rgb = 1.0 - exp2(-tonemappingCalibration * result.rgb);
	#endif
#endif

	// Going back to gamma space
	result.rgb = toGammaSpace(result.rgb);
	result.rgb = saturate(result.rgb);

#ifdef CONTRAST
	// Contrast EaseInOut
	vec3 resultHighContrast = result.rgb * result.rgb * (3.0 - 2.0 * result.rgb);
	
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
	#ifdef COLORGRADING3D
		vec3 colorTransformOutput = texture(txColorTransform, colorTransformInput).rgb;
	#else
		vec3 colorTransformOutput = sampleTexture3D(txColorTransform, colorTransformInput, colorTransformSettings.yz).rgb;
	#endif

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