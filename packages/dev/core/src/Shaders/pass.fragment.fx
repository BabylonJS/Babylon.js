// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#ifdef DUAL_SOURCE_BLENDING
	uniform sampler2D textureSampler2;
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) 
{
	gl_FragColor = texture2D(textureSampler, vUV);
#ifdef DUAL_SOURCE_BLENDING
	gl_FragColor2 = texture2D(textureSampler2, vUV);
#endif
}
