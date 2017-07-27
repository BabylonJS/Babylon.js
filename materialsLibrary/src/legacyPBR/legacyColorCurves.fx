const vec3 HDTVRec709_RGBLuminanceCoefficients = vec3(0.2126, 0.7152, 0.0722);

vec3 applyColorCurves(vec3 original) {
	vec3 result = original;

	// Apply colour grading curves: luma-based adjustments for saturation, exposure and white balance (color filter)
	// Note: the luma-based ramp is calibrated so that at 50% luma the midtone adjustment is full active, and the shadow/highlight 
	// adjustments are fully active by 16% and 83% luma, respectively.
	float luma = dot(result.rgb, HDTVRec709_RGBLuminanceCoefficients);

	vec2 curveMix = clamp(vec2(luma * 3.0 - 1.5, luma * -3.0 + 1.5), vec2(0.0, 0.0), vec2(1.0, 1.0));
	vec4 colorCurve = vCameraColorCurveNeutral + curveMix.x * vCameraColorCurvePositive - curveMix.y * vCameraColorCurveNegative;

	result.rgb *= colorCurve.rgb;
	result.rgb = mix(vec3(luma, luma, luma), result.rgb, colorCurve.a);

	return result;
}