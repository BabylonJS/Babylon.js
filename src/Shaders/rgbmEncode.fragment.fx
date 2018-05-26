// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#include<helperFunctions>

void main(void) 
{
	gl_FragColor = toRGBM(texture2D(textureSampler, vUV).rgb);
}