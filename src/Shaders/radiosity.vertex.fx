// Attributes
in vec2 uv2;

out vec2 vUV;

void main(void) {
	vUV = uv2;
	gl_Position = vec4(vUV.x * 2. - 1., vUV.y * 2. - 1., 0.0, 1.0);
}