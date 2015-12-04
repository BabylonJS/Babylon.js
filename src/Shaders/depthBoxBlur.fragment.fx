precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Parameters
uniform vec2 screenSize;

void main(void)
{
	vec4 colorDepth = vec4(0.0);

	for (int x = -OFFSET; x <= OFFSET; x++)
		for (int y = -OFFSET; y <= OFFSET; y++)
			colorDepth += texture2D(textureSampler, vUV + vec2(x, y) / screenSize);

	gl_FragColor = (colorDepth / float((OFFSET * 2 + 1) * (OFFSET * 2 + 1)));
}