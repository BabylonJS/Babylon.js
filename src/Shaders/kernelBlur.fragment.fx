// Parameters
uniform sampler2D textureSampler;
uniform vec2 delta;

// Varying
varying vec2 sampleCenter;

#ifdef DOF
	uniform sampler2D depthSampler;

	uniform float near;
	uniform float far;

	float sampleDistance(const in vec2 offset) {
		float depth = texture2D(depthSampler, offset).r; // depth value from DepthRenderer: 0 to 1 
		return near + (far - near)*depth; // actual distance from the lens 
	}
#endif

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
	#ifdef DOF
		float sumOfWeights = 0.0; // Since not all values are blended, keep track of sum to devide result by at the end to get an average
		float sampleDepth = 0.0;
    	float factor = 0.0;
		float centerSampleDepth = sampleDistance(sampleCenter);
	#endif

	float computedWeight = 0.0;

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

	#ifdef DOF
		// If there are no samples to blend, make pixel black.
		if(sumOfWeights == 0.0){
			gl_FragColor = vec4(0.0,0.0,0.0,1.0);
		}
		gl_FragColor /= sumOfWeights;
	#endif
}