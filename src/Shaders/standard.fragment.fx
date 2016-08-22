uniform sampler2D textureSampler;
varying vec2 vUV;

#if defined(PASS_POST_PROCESS)
void main(void)
{
	vec4 color = texture2D(textureSampler, vUV);
	gl_FragColor = color;
}
#endif

#if defined(DOWN_SAMPLE_X4)
uniform vec2 dsOffsets[16];

void main(void)
{
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

#if defined(BRIGHT_PASS)
uniform vec2 dsOffsets[4];
uniform float brightThreshold;

void main(void)
{
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

#if defined(GAUSSIAN_BLUR_H) || defined(GAUSSIAN_BLUR_V)
uniform float blurOffsets[9];
uniform float blurWeights[9];

void main(void)
{
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

	for (int i = 0; i < 9; i++) {
		#ifdef GAUSSIAN_BLUR_H
		color += (texture2D(textureSampler, vUV + vec2(blurOffsets[i] * 2.0, 0.0)) * blurWeights[i]);
		color += (texture2D(textureSampler, vUV - vec2(blurOffsets[i] * 2.0, 0.0)) * blurWeights[i]);
		#else
		color += (texture2D(textureSampler, vUV + vec2(0.0, blurOffsets[i] * 2.0)) * blurWeights[i]);
		color += (texture2D(textureSampler, vUV - vec2(0.0, blurOffsets[i] * 2.0)) * blurWeights[i]);
		#endif
	}

	color.a = 1.0;
	gl_FragColor = color;
}
#endif

#if defined(TEXTURE_ADDER)
uniform sampler2D otherSampler;
uniform sampler2D lensSampler;

uniform float exposure;

void main(void)
{
	vec3 colour = texture2D(textureSampler, vUV).rgb;
	
	colour *= exposure;

	vec3 X = max(vec3(0.0, 0.0, 0.0), colour - 0.004);
	vec3 retColor = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);

	colour = retColor * retColor;
	colour += colour * texture2D(lensSampler, vUV).rgb;

	gl_FragColor = vec4(colour.rgb, 1.0) + texture2D(otherSampler, vUV);
}
#endif

#if defined(DEPTH_OF_FIELD)
uniform sampler2D otherSampler;
uniform sampler2D depthSampler;

uniform float distance;

void main(void)
{
	vec4 sharp = texture2D(otherSampler, vUV);
	vec4 blur = texture2D(textureSampler, vUV);
	float dist = clamp(texture2D(depthSampler, vUV).r * distance, 0.0, 1.0);
	float factor = 0.0;

	if (dist < 0.05)
        factor = 1.0;
    else if (dist < 0.1)
        factor = 20.0 * (0.1 - dist);
    else if (dist < 0.5)
        factor=0.0;
    else
        factor = 2.0 * (dist - 0.5);

    factor = clamp(factor, 0.0, 0.90);
    gl_FragColor = mix(sharp, blur, factor);
}

#endif
