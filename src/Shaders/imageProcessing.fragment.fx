// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

void main(void)
{
	vec4 result = texture2D(textureSampler, vUV);

#ifdef IMAGEPROCESSING
	#ifndef FROMLINEARSPACE
		// Need to move to linear space for subsequent operations.
		result.rgb = toLinearSpace(result.rgb);
	#endif

	#ifdef GRAIN
		vec2 seed = vUV*(grainAnimatedSeed);
		float grain = dither(seed, grainVarianceAmount);

		// Add less grain when luminance is high or low
		float lum = getLuminance(result.rgb);
		float grainAmount = (cos(-PI + (lum*PI*2.))+1.)/2.;
		result.rgb += grain * grainAmount;

		result.rgb = max(result.rgb, 0.0);
	#endif

	result = applyImageProcessing(result);
#else
	// In case where the input is in linear space we at least need to put it back in gamma.
	#ifdef FROMLINEARSPACE
		result = applyImageProcessing(result);
	#endif
#endif

	gl_FragColor = result;
}