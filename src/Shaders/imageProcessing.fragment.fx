// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

const float GammaEncodePowerApprox = 1.0 / 2.2;
const vec3 RGBLuminanceCoefficients = vec3(0.2126, 0.7152, 0.0722);

uniform float contrast;
uniform vec4 vignetteSettings1;
uniform vec4 vignetteSettings2;
uniform float cameraExposureLinear;
uniform vec4 vCameraColorCurveNegative;
uniform vec4 vCameraColorCurveNeutral;
uniform vec4 vCameraColorCurvePositive;
uniform sampler2D txColorTransform;
uniform vec4 colorTransformSettings;

vec3 applyEaseInOut(vec3 x){
	return x * x * (3.0 - 2.0 * x);
}

/** 
 * Polyfill for SAMPLE_TEXTURE_3D, which is unsupported in WebGL.
 * colorTransformSettings.y = textureOffset (0.5 / textureSize).
 * colorTransformSettings.z = textureSize.
 */
vec3 sampleTexture3D(sampler2D colorTransform, vec3 color)
{
	float sliceSize = 2.0 * colorTransformSettings.y; // Size of 1 slice relative to the texture, for example 1/8

	float sliceContinuous = (color.y - colorTransformSettings.y) * colorTransformSettings.z;
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

vec4 applyImageProcessing(vec4 result, vec2 viewportXY){

	result.rgb *= cameraExposureLinear;

	//vignette
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
	
#ifdef TONEMAPPING	
	float tonemappingCalibration = 1.590579;
	result.rgb = 1.0 - exp2(-tonemappingCalibration * result.rgb);
#endif

	result.rgb = pow(result.rgb, vec3(GammaEncodePowerApprox));
	result.rgb = clamp(result.rgb, 0.0, 1.0);

	vec3 resultHighContrast = applyEaseInOut(result.rgb);

	if (contrast < 1.0) {
		result.rgb = mix(vec3(0.5, 0.5, 0.5), result.rgb, contrast);
	} else {
		result.rgb = mix(result.rgb, resultHighContrast, contrast - 1.0);
	}

	// Apply Color Transform
#ifdef COLORGRADING
	vec3 colorTransformInput = result.rgb * colorTransformSettings.xxx + colorTransformSettings.yyy;
	vec3 colorTransformOutput = sampleTexture3D(txColorTransform, colorTransformInput).rgb;

	result.rgb = mix(result.rgb, colorTransformOutput, colorTransformSettings.www);
#endif

	// Apply Color Curves
	float luma = dot(result.rgb, RGBLuminanceCoefficients);
	vec2 curveMix = clamp(vec2(luma * 3.0 - 1.5, luma * -3.0 + 1.5), vec2(0.0), vec2(1.0));
	vec4 colorCurve = vCameraColorCurveNeutral + curveMix.x * vCameraColorCurvePositive - curveMix.y * vCameraColorCurveNegative;

	result.rgb *= colorCurve.rgb;
	result.rgb = mix(vec3(luma), result.rgb, colorCurve.a);

	return result;
}

void main(void) 
{
	vec4 result = texture2D(textureSampler, vUV);

	vec2 viewportXY = vUV * 2.0 - 1.0;
	result = applyImageProcessing(result, viewportXY);

	gl_FragColor = result;
}