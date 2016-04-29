varying vec2 vUV;
uniform sampler2D diffuseSampler;

void main(void) {
	vec4 color = texture2D(diffuseSampler, vUV);
	
	if (color.w == 0.0)
		discard;

	gl_FragColor = color;
}