// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Offset
uniform float offset;

void main(void) {
	vec4 baseColor = texture2D(textureSampler, vUV);

	baseColor.a = abs(offset - baseColor.a);

	gl_FragColor = baseColor;
}