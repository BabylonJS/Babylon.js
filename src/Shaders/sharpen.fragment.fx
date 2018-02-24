// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform vec2 screenSize;
uniform vec2 sharpnessAmounts;

void main(void)
{
	vec2 onePixel = vec2(1.0, 1.0) / screenSize;
    vec4 color = texture2D(textureSampler, vUV);
	vec4 edgeDetection = texture2D(textureSampler, vUV + onePixel * vec2(0, -1)) +
		texture2D(textureSampler, vUV + onePixel * vec2(-1, 0)) +
		texture2D(textureSampler, vUV + onePixel * vec2(1, 0)) +
		texture2D(textureSampler, vUV + onePixel * vec2(0, 1)) -
        color * 4.0;
	
	gl_FragColor = max(vec4(color.rgb * sharpnessAmounts.y, color.a) - (sharpnessAmounts.x * vec4(edgeDetection.rgb, 0)), 0.);
}