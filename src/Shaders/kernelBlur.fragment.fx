// Parameters
uniform sampler2D textureSampler;
uniform vec2 delta;

// Varying
varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]

#ifdef PACKEDFLOAT
	vec4 pack(float depth)
	{
		const vec4 bit_shift = vec4(255.0 * 255.0 * 255.0, 255.0 * 255.0, 255.0, 1.0);
		const vec4 bit_mask = vec4(0.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);

		vec4 res = fract(depth * bit_shift);
		res -= res.xxyz * bit_mask;

		return res;
	}

	float unpack(vec4 color)
	{
		const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
		return dot(color, bit_shift);
	}
#endif

void main(void)
{
#ifdef PACKEDFLOAT	
	float blend = 0.;
#else
	vec4 blend = vec4(0.);
#endif

	#include<kernelBlurFragment>[0..varyingCount]
	#include<kernelBlurFragment2>[0..depCount]

	#ifdef PACKEDFLOAT
		gl_FragColor = pack(blend);
	#else
		gl_FragColor = blend;
	#endif
}