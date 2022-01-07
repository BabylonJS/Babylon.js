// Attributes
attribute vec2 position;

// Uniforms
uniform mat4 viewportMatrix;

// Output
varying vec2 vUV;

const vec2 madd = vec2(0.5, 0.5);


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

	vUV = position * madd + madd;
	gl_Position = viewportMatrix * vec4(position, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}