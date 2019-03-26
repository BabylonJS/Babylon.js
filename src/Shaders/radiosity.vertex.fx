// Attributes
in vec2 uv;

out vec2 vUV;

void main(void) {
	vUV = uv;
	gl_Position = vec4(vUV.x, vUV.y, 1.0, 1.0);
}