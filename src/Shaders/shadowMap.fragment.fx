#ifndef FLOAT
vec4 pack(float depth)
{
	const vec4 bit_shift = vec4(255.0 * 255.0 * 255.0, 255.0 * 255.0, 255.0, 1.0);
	const vec4 bit_mask = vec4(0.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);

	vec4 res = fract(depth * bit_shift);
	res -= res.xxyz * bit_mask;

	return res;
}
#endif

varying float vDepthMetric;

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

uniform vec2 biasAndScale;
uniform vec2 depthValues;

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

	float depth = vDepthMetric;

#ifdef ESM
	depth = clamp(exp(-min(87., biasAndScale.y * depth)), 0., 1.);
#endif

#ifdef FLOAT
	gl_FragColor = vec4(depth, 1.0, 1.0, 1.0);
#else
	gl_FragColor = pack(depth);
#endif
}