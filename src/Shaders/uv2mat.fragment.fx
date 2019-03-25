// Attributes
in vec2 vUV2;

void main(void) {
	bool xParity = (mod(vUV2.x * 10.0, 2.) < 1.0);
	bool yParity = (mod(vUV2.y * 10.0, 2.) < 1.0);
	gl_FragColor = vec4(1.0, xParity ^^ yParity, xParity ^^ yParity, 1.);
}