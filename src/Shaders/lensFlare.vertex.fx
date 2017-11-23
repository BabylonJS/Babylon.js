// Attributes
attribute vec2 position;

// Uniforms
uniform mat4 viewportMatrix;

// Output
varying vec2 vUV;

const vec2 madd = vec2(0.5, 0.5);

void main(void) {	

	vUV = position * madd + madd;
	gl_Position = viewportMatrix * vec4(position, 0.0, 1.0);
}