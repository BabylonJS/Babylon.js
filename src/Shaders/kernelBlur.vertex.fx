// Attributes
attribute vec2 position;

// Uniform
uniform vec2 delta;

// Output
varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]

const vec2 madd = vec2(0.5, 0.5);


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

	sampleCenter = (position * madd + madd);

	#include<kernelBlurVertex>[0..varyingCount]

	gl_Position = vec4(position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}