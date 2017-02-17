// Attributes
attribute vec2 position;

// Output
varying vec2 vPosition;
varying vec2 vUV;

const vec2 madd = vec2(0.5, 0.5);

void main(void) {	
	vPosition = position;
	vUV = position * madd + madd;
	gl_Position = vec4(position, 0.0, 1.0);
}