// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#include<helperFunctions>

void main(void) 
{
	gl_FragColor = vec4(fromRGBM(texture2D(textureSampler, vUV)), 1.0);
}