// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#include<helperFunctions>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) 
{
	gl_FragColor = toRGBD(texture2D(textureSampler, vUV).rgb);
}