// Attributes
in vec2 vUV2;
uniform sampler2D itemBuffer;

void main(void) {
	gl_FragColor = vec4(texture(itemBuffer, vUV2).xyz, 1.0);
}