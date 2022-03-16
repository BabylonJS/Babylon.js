// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) 
{
	gl_FragColor = texture2D(textureSampler, vUV);
}