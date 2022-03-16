// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#include<helperFunctions>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) 
{
	gl_FragColor = vec4(fromRGBD(texture2D(textureSampler, vUV)), 1.0);
}