varying vec2 vUV;
varying float vOpacity;
uniform bool alphaTest;
uniform sampler2D diffuseSampler;

void main(void) {
	vec4 color = texture2D(diffuseSampler, vUV);

	if (alphaTest)
	{
		if (color.a < 0.95) {
			discard;
		}
	}
	color.a *= vOpacity;
	gl_FragColor = color;
}