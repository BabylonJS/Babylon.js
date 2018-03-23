#include<helperFunctions>

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float threshold;
uniform float exposure;

void main(void) 
{
	gl_FragColor = texture2D(textureSampler, vUV);
	float luma = getLuminance(gl_FragColor.rgb * exposure);
	gl_FragColor.rgb = step(threshold, luma) * gl_FragColor.rgb;
}