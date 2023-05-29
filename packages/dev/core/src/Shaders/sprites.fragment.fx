uniform bool alphaTest;

varying vec4 vColor;

// Samplers
varying vec2 vUV;
uniform sampler2D diffuseSampler;

// Fog
#include<fogFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

#ifdef PIXEL_PERFECT
// see iq comment here: https://www.shadertoy.com/view/MllBWf
vec2 uvPixelPerfect(vec2 uv) {
    vec2 res = vec2(textureSize(diffuseSampler, 0));
    
    uv = uv * res;
    vec2 seam = floor(uv + 0.5);
    uv = seam + clamp((uv-seam) / fwidth(uv), -0.5, 0.5);
    return uv / res;
}
#endif

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	#ifdef PIXEL_PERFECT
		vec2 uv = uvPixelPerfect(vUV);
	#else
		vec2 uv = vUV;
	#endif

	vec4 color = texture2D(diffuseSampler, uv);
	// Fix for ios14 and lower
	float fAlphaTest = float(alphaTest);

	if (fAlphaTest != 0.)
	{
		if (color.a < 0.95)
			discard;
	}

	color *= vColor;

#include<fogFragment>

	gl_FragColor = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}