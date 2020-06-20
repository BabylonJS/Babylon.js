// Attributes
attribute vec2 position;

// Output
varying vec3 direction;

// Uniforms
uniform vec3 up;
uniform vec3 right;
uniform vec3 front;

void main(void) {	
	mat3 view = mat3(up, right, front);
	direction = view * vec3(position, 1.0);
	gl_Position = vec4(position, 0.0, 1.0);
}