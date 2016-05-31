varying vec4 vColor;
varying vec2 vUV;

// Samplers
uniform sampler2D diffuseSampler;

void main(void) {
	vec4 color = texture2D(diffuseSampler, vUV);
	if (color.a < 0.05)
		discard;
	gl_FragColor = color*vColor;
}