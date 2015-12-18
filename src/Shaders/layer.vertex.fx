precision highp float;

// Attributes
attribute vec2 position;

// Uniforms
uniform mat4 textureMatrix;

// Output
varying vec2 vUV;

const vec2 madd = vec2(0.5, 0.5);

void main(void) {	

	vUV = vec2(textureMatrix * vec4(position * madd + madd, 1.0, 0.0));
	gl_Position = vec4(position, 0.0, 1.0);
}