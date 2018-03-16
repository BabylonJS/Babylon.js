#include<helperFunctions>

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float threshold;
const vec3 RGBLuminanceCoefficients = vec3(0.2126, 0.7152, 0.0722);

void main(void) 
{
	gl_FragColor = texture2D(textureSampler, vUV);
	float luma = getLuminance(gl_FragColor.rgb);
	gl_FragColor.rgb = step(threshold, luma) * gl_FragColor.rgb;
}