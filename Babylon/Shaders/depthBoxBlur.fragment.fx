#ifdef GL_ES
precision highp float;
#endif

#define OFFSET 1

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Parameters
uniform vec2 screenSize;

vec4 pack(float depth)
{
	const vec4 bit_shift = vec4(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);
	const vec4 bit_mask = vec4(0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);

	vec4 res = fract(depth * bit_shift);
	res -= res.xxyz * bit_mask;

	return res;
}

float unpack(vec4 color)
{
	const vec4 bit_shift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
	return dot(color, bit_shift);
}

void main(void)
{
	vec4 colorDepth = vec4(0.0);

	for (int x = -OFFSET; x <= OFFSET; x++)
		for (int y = -OFFSET; y <= OFFSET; y++)
			colorDepth += texture2D(textureSampler, vUV + vec2(x, y) / screenSize);

	gl_FragColor = (colorDepth / float((OFFSET * 2 + 1) * (OFFSET * 2 + 1)));
}