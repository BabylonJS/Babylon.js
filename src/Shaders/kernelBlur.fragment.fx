// Parameters
uniform sampler2D textureSampler;
uniform vec2 delta;

// Varying
varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]

void main(void)
{
	vec4 blend = vec4(0.);
	#include<kernelBlurFragment>[0..varyingCount]
	#include<kernelBlurFragment2>[0..depCount]
	gl_FragColor = blend;
}