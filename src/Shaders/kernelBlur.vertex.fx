// Attributes
attribute vec2 position;

// Uniform
uniform vec2 delta;

// Output
varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]

const vec2 madd = vec2(0.5, 0.5);

void main(void) {	

	sampleCenter = (position * madd + madd);

	#include<kernelBlurVertex>[0..varyingCount]

	gl_Position = vec4(position, 0.0, 1.0);
}