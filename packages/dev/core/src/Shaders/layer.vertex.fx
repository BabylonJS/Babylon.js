// Attributes
attribute vec2 position;

// Uniforms
uniform vec2 scale;
uniform vec2 offset;
uniform mat4 textureMatrix;

// Output
varying vec2 vUV;

const vec2 madd = vec2(0.5, 0.5);


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

	vec2 shiftedPosition = position * scale + offset;
	vUV = vec2(textureMatrix * vec4(shiftedPosition * madd + madd, 1.0, 0.0));
	gl_Position = vec4(shiftedPosition, 0.0, 1.0);

#define CUSTOM_VERTEX_MAIN_END

}