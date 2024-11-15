// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Color
uniform vec4 color;

// Helper functions
#include<helperFunctions>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	vec4 baseColor = texture2D(textureSampler, vUV);
	
#if defined(CONVERT_TO_GAMMA)
	baseColor.rgb = toGammaSpace(baseColor.rgb);
#elif defined(CONVERT_TO_LINEAR)
	baseColor.rgb = toLinearSpace(baseColor.rgb);
#endif

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif



	gl_FragColor = baseColor * color;

#define CUSTOM_FRAGMENT_MAIN_END
	
}