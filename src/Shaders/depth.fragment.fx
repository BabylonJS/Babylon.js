#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

varying float vDepthMetric;

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

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

#ifdef NONELINEARDEPTH
	#ifdef FLOAT
		gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
	#else
		gl_FragColor = pack(gl_FragCoord.z);
	#endif
#else
	#ifdef FLOAT
		gl_FragColor = vec4(vDepthMetric, 0.0, 0.0, 1.0);
	#else
		gl_FragColor = pack(vDepthMetric);
	#endif
#endif
}