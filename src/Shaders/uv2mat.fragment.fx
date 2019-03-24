// Attributes
in vec2 vUV2;

void main(void) {
	gl_FragColor = vec4(vUV2.x, vUV2.y, 0., 1.);
}