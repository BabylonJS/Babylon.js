varying vec2 vUV;
varying float vOpacity;
uniform sampler2D diffuseSampler;

void main(void) {
	vec4 color = texture2D(diffuseSampler, vUV);
	if (color.a < 0.05) {
		discard;
	}
	color.a *= vOpacity;
	gl_FragColor = color;
}