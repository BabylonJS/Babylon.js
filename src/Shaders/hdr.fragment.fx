precision highp float;

uniform sampler2D textureSampler;
varying vec2 vUV;

#if defined(GAUSSIAN_BLUR_H) || defined(GAUSSIAN_BLUR_V)
uniform float blurOffsets[9];
uniform float blurWeights[9];
uniform float multiplier;

void main(void) {
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

	for (int i = 0; i < 9; i++) {
		#ifdef GAUSSIAN_BLUR_H
		color += (texture2D(textureSampler, vUV + vec2(blurOffsets[i] * multiplier, 0.0)) * blurWeights[i]);
		#else
		color += (texture2D(textureSampler, vUV + vec2(0.0, blurOffsets[i] * multiplier)) * blurWeights[i]);
		#endif
	}

	color.a = 1.0;
	gl_FragColor = color;
}
#endif

#if defined(TEXTURE_ADDER)
uniform sampler2D otherSampler;

void main() {
	vec4 sum = texture2D(textureSampler, vUV) + texture2D(otherSampler, vUV);
	sum.a = clamp(sum.a, 0.0, 1.0);

	gl_FragColor = sum;
}
#endif

#if defined(LUMINANCE_GENERATOR)
uniform vec2 lumOffsets[4];

void main() {
	float average = 0.0;
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
	float maximum = -1e20;

	for (int i = 0; i < 4; i++) {
		color = texture2D(textureSampler, vUV + lumOffsets[i]);

		float GreyValue = length(color.rgb);

		maximum = max(maximum, GreyValue);
		average += (0.25 * log(1e-5 + GreyValue));
	}

	average = exp(average);

	gl_FragColor = vec4(average, maximum, 0.0, 1.0);

}
#endif

#if defined(DOWN_SAMPLE)
uniform vec2 dsOffsets[9];
uniform float halfDestPixelSize;

#ifdef FINAL_DOWN_SAMPLE
vec4 pack(float value) {
	const vec4 bit_shift = vec4(255.0 * 255.0 * 255.0, 255.0 * 255.0, 255.0, 1.0);
	const vec4 bit_mask = vec4(0.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);

	vec4 res = fract(value * bit_shift);
	res -= res.xxyz * bit_mask;

	return res;
}
#endif

void main() {
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
	float average = 0.0;

	for (int i = 0; i < 9; i++) {
		color = texture2D(textureSampler, vUV + vec2(halfDestPixelSize, halfDestPixelSize) + dsOffsets[i]);
		average += color.r;
	}

	average /= 9.0;

	#ifndef FINAL_DOWN_SAMPLE
	gl_FragColor = vec4(average, average, 0.0, 1.0);
	#else
	gl_FragColor = pack(average);
	#endif
}
#endif

#if defined(BRIGHT_PASS)
uniform vec2 dsOffsets[4];
uniform float brightThreshold;

void main() {
	vec4 average = vec4(0.0, 0.0, 0.0, 0.0);

	average = texture2D(textureSampler, vUV + vec2(dsOffsets[0].x, dsOffsets[0].y));
	average += texture2D(textureSampler, vUV + vec2(dsOffsets[1].x, dsOffsets[1].y));
	average += texture2D(textureSampler, vUV + vec2(dsOffsets[2].x, dsOffsets[2].y));
	average += texture2D(textureSampler, vUV + vec2(dsOffsets[3].x, dsOffsets[3].y));

	average *= 0.25;

	float luminance = length(average.rgb);

	if (luminance < brightThreshold) {
		average = vec4(0.0, 0.0, 0.0, 1.0);
	}

	gl_FragColor = average;
}
#endif

#if defined(DOWN_SAMPLE_X4)
uniform vec2 dsOffsets[16];

void main() {
	vec4 average = vec4(0.0, 0.0, 0.0, 0.0);

	average = texture2D(textureSampler, vUV + dsOffsets[0]);
	average += texture2D(textureSampler, vUV + dsOffsets[1]);
	average += texture2D(textureSampler, vUV + dsOffsets[2]);
	average += texture2D(textureSampler, vUV + dsOffsets[3]);
	average += texture2D(textureSampler, vUV + dsOffsets[4]);
	average += texture2D(textureSampler, vUV + dsOffsets[5]);
	average += texture2D(textureSampler, vUV + dsOffsets[6]);
	average += texture2D(textureSampler, vUV + dsOffsets[7]);
	average += texture2D(textureSampler, vUV + dsOffsets[8]);
	average += texture2D(textureSampler, vUV + dsOffsets[9]);
	average += texture2D(textureSampler, vUV + dsOffsets[10]);
	average += texture2D(textureSampler, vUV + dsOffsets[11]);
	average += texture2D(textureSampler, vUV + dsOffsets[12]);
	average += texture2D(textureSampler, vUV + dsOffsets[13]);
	average += texture2D(textureSampler, vUV + dsOffsets[14]);
	average += texture2D(textureSampler, vUV + dsOffsets[15]);

	average /= 16.0;

	gl_FragColor = average;
}
#endif

#if defined(HDR)
uniform sampler2D otherSampler;

uniform float exposure;
uniform float avgLuminance;

void main() {
	vec4 color = texture2D(textureSampler, vUV) + texture2D(otherSampler, vUV);
	vec4 adjustedColor = color / avgLuminance * exposure;

	color = adjustedColor;
	color.a = 1.0;

	gl_FragColor = color;
}
#endif
